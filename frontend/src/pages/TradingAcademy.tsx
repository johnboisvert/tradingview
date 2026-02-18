import { useState } from "react";
import Sidebar from "../components/Sidebar";

interface Lesson {
  id: number;
  title: string;
  icon: string;
  level: "Débutant" | "Intermédiaire" | "Avancé";
  duration: string;
  description: string;
  topics: string[];
  completed: boolean;
}

const LESSONS: Lesson[] = [
  { id: 1, title: "Introduction au Trading Crypto", icon: "📚", level: "Débutant", duration: "15 min", description: "Les bases du trading de cryptomonnaies : marchés, exchanges, et premiers pas.", topics: ["Qu'est-ce que le trading ?", "Types d'ordres (Market, Limit, Stop)", "Lire un graphique de prix", "Choisir un exchange"], completed: false },
  { id: 2, title: "Analyse Technique Fondamentale", icon: "📈", level: "Débutant", duration: "25 min", description: "Apprenez à lire les graphiques et identifier les tendances du marché.", topics: ["Supports et résistances", "Lignes de tendance", "Chandeliers japonais", "Volumes"], completed: false },
  { id: 3, title: "Indicateurs Techniques", icon: "📊", level: "Intermédiaire", duration: "30 min", description: "Maîtrisez les indicateurs RSI, MACD, Bollinger Bands et plus.", topics: ["RSI (Relative Strength Index)", "MACD", "Bollinger Bands", "Moyennes mobiles (EMA/SMA)"], completed: false },
  { id: 4, title: "Patterns Chartistes", icon: "🔍", level: "Intermédiaire", duration: "35 min", description: "Identifiez les figures chartistes pour anticiper les mouvements.", topics: ["Double Top/Bottom", "Head & Shoulders", "Triangles", "Flags & Pennants"], completed: false },
  { id: 5, title: "Gestion du Risque", icon: "🛡️", level: "Intermédiaire", duration: "20 min", description: "Protégez votre capital avec une gestion du risque rigoureuse.", topics: ["Position sizing", "Risk/Reward ratio", "Stop Loss placement", "Diversification"], completed: false },
  { id: 6, title: "Psychologie du Trading", icon: "🧠", level: "Avancé", duration: "25 min", description: "Maîtrisez vos émotions pour devenir un trader discipliné.", topics: ["FOMO et FUD", "Biais cognitifs", "Journal de trading", "Discipline et routine"], completed: false },
  { id: 7, title: "Stratégies Avancées", icon: "⚡", level: "Avancé", duration: "40 min", description: "Stratégies de trading avancées : scalping, swing, et position trading.", topics: ["Scalping", "Swing Trading", "Position Trading", "Arbitrage"], completed: false },
  { id: 8, title: "DeFi & On-Chain Analysis", icon: "⛓️", level: "Avancé", duration: "35 min", description: "Analysez les données on-chain pour des décisions éclairées.", topics: ["TVL et métriques DeFi", "Whale tracking", "Exchange flows", "NVT et MVRV"], completed: false },
  { id: 9, title: "Trading Algorithmique", icon: "🤖", level: "Avancé", duration: "45 min", description: "Introduction aux bots de trading et stratégies automatisées.", topics: ["Bots de trading", "Backtesting", "API exchanges", "Grid trading"], completed: false },
];

const LEVEL_STYLES: Record<string, { bg: string; text: string }> = {
  "Débutant": { bg: "bg-emerald-500/10", text: "text-emerald-400" },
  "Intermédiaire": { bg: "bg-amber-500/10", text: "text-amber-400" },
  "Avancé": { bg: "bg-red-500/10", text: "text-red-400" },
};

export default function TradingAcademy() {
  const [lessons, setLessons] = useState(LESSONS);
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [levelFilter, setLevelFilter] = useState("ALL");

  const toggleComplete = (id: number) => {
    setLessons(lessons.map((l) => l.id === id ? { ...l, completed: !l.completed } : l));
  };

  const filtered = levelFilter === "ALL" ? lessons : lessons.filter((l) => l.level === levelFilter);
  const completedCount = lessons.filter((l) => l.completed).length;
  const progress = Math.round((completedCount / lessons.length) * 100);

  return (
    <div className="flex min-h-screen bg-[#030712]">
      <Sidebar />
      <main className="flex-1 ml-[260px] p-7">
        <div className="fixed inset-0 pointer-events-none z-0">
          <div className="absolute w-[600px] h-[600px] rounded-full bg-blue-500/5 blur-[80px] top-[-200px] left-[-100px]" />
          <div className="absolute w-[500px] h-[500px] rounded-full bg-amber-500/5 blur-[80px] bottom-[-200px] right-[-100px]" />
        </div>
        <div className="relative z-10 max-w-[1200px] mx-auto">
          <div className="text-center mb-10 pt-8">
            <h1 className="text-5xl font-black bg-gradient-to-r from-blue-400 via-amber-400 to-blue-400 bg-[length:300%_auto] bg-clip-text text-transparent animate-gradient">
              🎓 Trading Academy
            </h1>
            <p className="text-gray-500 mt-3 text-lg">Apprenez le trading crypto de A à Z avec nos cours structurés</p>
          </div>

          {/* Progress */}
          <div className="bg-slate-900/70 border border-white/5 rounded-3xl p-6 mb-6">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-bold text-white">📊 Votre Progression</h2>
              <span className="text-sm font-bold text-blue-400">{completedCount}/{lessons.length} leçons</span>
            </div>
            <div className="h-3 bg-white/5 rounded-full overflow-hidden">
              <div className="h-full rounded-full bg-gradient-to-r from-blue-500 to-amber-400 transition-all" style={{ width: `${progress}%` }} />
            </div>
            <div className="text-xs text-gray-500 mt-2">{progress}% complété</div>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-2 mb-6 justify-center">
            {["ALL", "Débutant", "Intermédiaire", "Avancé"].map((l) => (
              <button key={l} onClick={() => setLevelFilter(l)} className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${levelFilter === l ? "bg-blue-500/20 text-blue-400 border border-blue-500/30" : "bg-slate-800/50 text-gray-500 hover:text-white border border-white/5"}`}>
                {l === "ALL" ? "Tous les niveaux" : l}
              </button>
            ))}
          </div>

          {/* Lessons Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            {filtered.map((lesson) => {
              const lvl = LEVEL_STYLES[lesson.level];
              return (
                <div key={lesson.id} onClick={() => setSelectedLesson(lesson)} className={`cursor-pointer bg-slate-900/70 border rounded-2xl p-6 transition-all hover:-translate-y-1 ${selectedLesson?.id === lesson.id ? "border-blue-500/40" : "border-white/5 hover:border-blue-500/20"} ${lesson.completed ? "opacity-70" : ""}`}>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-3xl">{lesson.icon}</span>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-bold px-2 py-1 rounded-lg ${lvl.bg} ${lvl.text}`}>{lesson.level}</span>
                      {lesson.completed && <span className="text-emerald-400">✅</span>}
                    </div>
                  </div>
                  <h3 className="text-sm font-bold text-white mb-2">{lesson.title}</h3>
                  <p className="text-xs text-gray-400 mb-3 line-clamp-2">{lesson.description}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">⏱️ {lesson.duration}</span>
                    <span className="text-xs text-gray-500">{lesson.topics.length} sujets</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Selected Lesson Detail */}
          {selectedLesson && (
            <div className="bg-slate-900/70 border border-white/5 rounded-3xl p-8">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                  <span className="text-4xl">{selectedLesson.icon}</span>
                  <div>
                    <h2 className="text-xl font-bold text-white">{selectedLesson.title}</h2>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-xs font-bold px-2 py-1 rounded-lg ${LEVEL_STYLES[selectedLesson.level].bg} ${LEVEL_STYLES[selectedLesson.level].text}`}>{selectedLesson.level}</span>
                      <span className="text-xs text-gray-500">⏱️ {selectedLesson.duration}</span>
                    </div>
                  </div>
                </div>
                <button onClick={() => toggleComplete(selectedLesson.id)} className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${selectedLesson.completed ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30" : "bg-blue-500/10 text-blue-400 border border-blue-500/30 hover:bg-blue-500/20"}`}>
                  {selectedLesson.completed ? "✅ Terminé" : "Marquer comme terminé"}
                </button>
              </div>
              <p className="text-sm text-gray-400 mb-6">{selectedLesson.description}</p>
              <h3 className="text-sm font-bold text-white mb-4">📋 Sujets abordés</h3>
              <div className="space-y-2">
                {selectedLesson.topics.map((topic, i) => (
                  <div key={topic} className="flex items-center gap-3 p-3 bg-white/[0.02] rounded-xl">
                    <span className="w-7 h-7 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center text-xs font-bold">{i + 1}</span>
                    <span className="text-sm text-gray-300">{topic}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}