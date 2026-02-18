import { useState } from "react";
import Sidebar from "../components/Sidebar";

interface Setup {
  name: string;
  entry: string;
  stopLoss: string;
  takeProfit: string;
  timeframe: string;
  indicators: string[];
  riskReward: string;
  confidence: number;
  description: string;
}

const PRESET_SETUPS: Setup[] = [
  {
    name: "Scalp RSI Reversal",
    entry: "RSI < 25 + Bougie de retournement",
    stopLoss: "Sous le dernier creux (-1.5%)",
    takeProfit: "RSI > 65 ou +3%",
    timeframe: "5m / 15m",
    indicators: ["RSI 14", "Volume", "EMA 20"],
    riskReward: "1:2",
    confidence: 72,
    description: "Scalping sur les retournements RSI en zone de survente. Idéal en range.",
  },
  {
    name: "Breakout Momentum",
    entry: "Cassure résistance + Volume > 2x moyenne",
    stopLoss: "Sous la résistance cassée (-2%)",
    takeProfit: "Extension Fibonacci 1.618",
    timeframe: "1h / 4h",
    indicators: ["Volume", "VWAP", "Bollinger Bands"],
    riskReward: "1:3",
    confidence: 78,
    description: "Capture les cassures de résistance avec confirmation de volume.",
  },
  {
    name: "EMA Cross Trend",
    entry: "EMA 9 croise EMA 21 à la hausse",
    stopLoss: "Sous EMA 50 (-3%)",
    takeProfit: "EMA 9 croise EMA 21 à la baisse",
    timeframe: "4h / 1d",
    indicators: ["EMA 9", "EMA 21", "EMA 50", "MACD"],
    riskReward: "1:2.5",
    confidence: 75,
    description: "Suivi de tendance classique avec croisement de moyennes mobiles.",
  },
  {
    name: "Support Bounce",
    entry: "Test du support + Divergence RSI haussière",
    stopLoss: "Sous le support (-2.5%)",
    takeProfit: "Résistance suivante",
    timeframe: "1h / 4h",
    indicators: ["RSI 14", "Support/Résistance", "Volume"],
    riskReward: "1:3",
    confidence: 70,
    description: "Rebond sur support majeur avec confirmation de divergence.",
  },
  {
    name: "MACD Divergence",
    entry: "Divergence haussière MACD + Support",
    stopLoss: "Sous le dernier creux (-3%)",
    takeProfit: "Signal MACD baissier",
    timeframe: "4h / 1d",
    indicators: ["MACD", "RSI", "Volume"],
    riskReward: "1:2.5",
    confidence: 68,
    description: "Détection de divergences MACD pour anticiper les retournements.",
  },
  {
    name: "Bollinger Squeeze",
    entry: "Squeeze Bollinger + Breakout directionnel",
    stopLoss: "Bande opposée (-2%)",
    takeProfit: "Extension 2x largeur des bandes",
    timeframe: "1h / 4h",
    indicators: ["Bollinger Bands", "Volume", "ATR"],
    riskReward: "1:2",
    confidence: 73,
    description: "Profitez de l'expansion de volatilité après une phase de compression.",
  },
];

export default function AISetupBuilder() {
  const [selectedSetup, setSelectedSetup] = useState<Setup | null>(null);
  const [customSetup, setCustomSetup] = useState({
    pair: "BTCUSDT",
    capital: "1000",
    riskPct: "2",
    timeframe: "4h",
    strategy: "trend",
  });
  const [generated, setGenerated] = useState<Setup | null>(null);
  const [generating, setGenerating] = useState(false);

  const generateSetup = () => {
    setGenerating(true);
    setTimeout(() => {
      const strategies: Record<string, Setup> = {
        trend: {
          name: `Trend ${customSetup.pair} ${customSetup.timeframe}`,
          entry: "EMA 20 > EMA 50 + Prix au-dessus des deux EMA",
          stopLoss: `Sous EMA 50 (-${customSetup.riskPct}%)`,
          takeProfit: "Trailing stop à 2x ATR",
          timeframe: customSetup.timeframe,
          indicators: ["EMA 20", "EMA 50", "ATR", "Volume"],
          riskReward: "1:2.5",
          confidence: 70 + Math.round(Math.random() * 15),
          description: `Setup de suivi de tendance optimisé pour ${customSetup.pair} en ${customSetup.timeframe}. Capital: $${customSetup.capital}, Risque: ${customSetup.riskPct}%.`,
        },
        scalp: {
          name: `Scalp ${customSetup.pair} ${customSetup.timeframe}`,
          entry: "RSI < 30 + Bougie englobante haussière",
          stopLoss: `Sous le creux (-${customSetup.riskPct}%)`,
          takeProfit: "RSI > 60 ou +2%",
          timeframe: customSetup.timeframe,
          indicators: ["RSI 14", "Volume", "VWAP"],
          riskReward: "1:1.5",
          confidence: 65 + Math.round(Math.random() * 15),
          description: `Setup de scalping sur ${customSetup.pair}. Entrées rapides sur survente RSI.`,
        },
        breakout: {
          name: `Breakout ${customSetup.pair} ${customSetup.timeframe}`,
          entry: "Cassure de range + Volume 2x supérieur à la moyenne",
          stopLoss: `Milieu du range (-${customSetup.riskPct}%)`,
          takeProfit: "Hauteur du range projetée",
          timeframe: customSetup.timeframe,
          indicators: ["Volume", "Bollinger Bands", "ATR"],
          riskReward: "1:3",
          confidence: 72 + Math.round(Math.random() * 13),
          description: `Setup de breakout pour ${customSetup.pair}. Capture les explosions de volatilité.`,
        },
      };
      setGenerated(strategies[customSetup.strategy] || strategies.trend);
      setGenerating(false);
    }, 2000);
  };

  const renderSetup = (setup: Setup) => (
    <div className="bg-slate-900/70 border border-white/5 rounded-3xl p-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-white">{setup.name}</h2>
        <span className={`text-sm font-bold px-3 py-1.5 rounded-xl ${setup.confidence > 75 ? "bg-emerald-500/10 text-emerald-400" : setup.confidence > 60 ? "bg-amber-500/10 text-amber-400" : "bg-gray-500/10 text-gray-400"}`}>
          Confiance: {setup.confidence}%
        </span>
      </div>
      <p className="text-sm text-gray-400 mb-6">{setup.description}</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { icon: "🎯", label: "Entrée", value: setup.entry, color: "border-l-blue-500" },
          { icon: "🛑", label: "Stop Loss", value: setup.stopLoss, color: "border-l-red-500" },
          { icon: "💰", label: "Take Profit", value: setup.takeProfit, color: "border-l-emerald-500" },
          { icon: "⏱️", label: "Timeframe", value: setup.timeframe, color: "border-l-amber-500" },
        ].map((item) => (
          <div key={item.label} className={`bg-white/[0.03] ${item.color} border-l-4 rounded-xl p-4`}>
            <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">{item.icon} {item.label}</div>
            <div className="text-sm font-bold text-white">{item.value}</div>
          </div>
        ))}
      </div>
      <div className="flex items-center gap-4">
        <div className="text-sm text-gray-400">
          <span className="font-bold text-white">R:R</span> {setup.riskReward}
        </div>
        <div className="flex flex-wrap gap-1.5">
          {setup.indicators.map((ind) => (
            <span key={ind} className="text-xs bg-indigo-500/10 text-indigo-400 px-2 py-1 rounded-lg font-semibold">{ind}</span>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-[#030712]">
      <Sidebar />
      <main className="flex-1 ml-[260px] p-7">
        <div className="fixed inset-0 pointer-events-none z-0">
          <div className="absolute w-[600px] h-[600px] rounded-full bg-violet-500/5 blur-[80px] top-[-200px] left-[-100px]" />
          <div className="absolute w-[500px] h-[500px] rounded-full bg-cyan-500/5 blur-[80px] bottom-[-200px] right-[-100px]" />
        </div>
        <div className="relative z-10 max-w-[1440px] mx-auto">
          <div className="text-center mb-10 pt-8">
            <h1 className="text-5xl font-black bg-gradient-to-r from-violet-400 via-cyan-400 to-violet-400 bg-[length:300%_auto] bg-clip-text text-transparent animate-gradient">
              🏗️ AI Setup Builder
            </h1>
            <p className="text-gray-500 mt-3 text-lg">Générez des setups de trading personnalisés par IA</p>
          </div>

          {/* Custom Generator */}
          <div className="bg-slate-900/70 border border-white/5 rounded-3xl p-8 mb-6">
            <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2">⚙️ Générateur de Setup</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
              <div>
                <label className="block text-xs text-gray-500 font-bold uppercase tracking-wider mb-2">Paire</label>
                <select value={customSetup.pair} onChange={(e) => setCustomSetup({ ...customSetup, pair: e.target.value })} className="w-full px-4 py-3 bg-slate-800/80 border border-white/10 rounded-xl text-white text-sm focus:border-violet-500 outline-none">
                  {["BTCUSDT", "ETHUSDT", "SOLUSDT", "BNBUSDT", "XRPUSDT"].map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-500 font-bold uppercase tracking-wider mb-2">Capital ($)</label>
                <input type="number" value={customSetup.capital} onChange={(e) => setCustomSetup({ ...customSetup, capital: e.target.value })} className="w-full px-4 py-3 bg-slate-800/80 border border-white/10 rounded-xl text-white text-sm focus:border-violet-500 outline-none" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 font-bold uppercase tracking-wider mb-2">Risque (%)</label>
                <input type="number" value={customSetup.riskPct} onChange={(e) => setCustomSetup({ ...customSetup, riskPct: e.target.value })} className="w-full px-4 py-3 bg-slate-800/80 border border-white/10 rounded-xl text-white text-sm focus:border-violet-500 outline-none" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 font-bold uppercase tracking-wider mb-2">Timeframe</label>
                <select value={customSetup.timeframe} onChange={(e) => setCustomSetup({ ...customSetup, timeframe: e.target.value })} className="w-full px-4 py-3 bg-slate-800/80 border border-white/10 rounded-xl text-white text-sm focus:border-violet-500 outline-none">
                  {["5m", "15m", "1h", "4h", "1d"].map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-500 font-bold uppercase tracking-wider mb-2">Style</label>
                <select value={customSetup.strategy} onChange={(e) => setCustomSetup({ ...customSetup, strategy: e.target.value })} className="w-full px-4 py-3 bg-slate-800/80 border border-white/10 rounded-xl text-white text-sm focus:border-violet-500 outline-none">
                  <option value="trend">Trend Following</option>
                  <option value="scalp">Scalping</option>
                  <option value="breakout">Breakout</option>
                </select>
              </div>
            </div>
            <button onClick={generateSetup} disabled={generating} className="px-8 py-3 bg-gradient-to-r from-violet-500 to-cyan-500 text-white font-bold rounded-xl hover:shadow-lg hover:shadow-violet-500/20 transition-all disabled:opacity-50">
              {generating ? "🧠 Génération IA en cours..." : "🚀 Générer le Setup"}
            </button>
          </div>

          {generated && renderSetup(generated)}

          {/* Preset Setups */}
          <h2 className="text-xl font-bold text-white mt-8 mb-4 flex items-center gap-2">📚 Setups Prédéfinis</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            {PRESET_SETUPS.map((setup) => (
              <button key={setup.name} onClick={() => setSelectedSetup(setup)} className={`text-left bg-slate-900/70 border rounded-2xl p-5 transition-all hover:-translate-y-1 ${selectedSetup?.name === setup.name ? "border-violet-500/40" : "border-white/5 hover:border-violet-500/20"}`}>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-bold text-white">{setup.name}</h3>
                  <span className="text-xs font-bold text-violet-400">{setup.confidence}%</span>
                </div>
                <p className="text-xs text-gray-400 mb-3 line-clamp-2">{setup.description}</p>
                <div className="flex items-center gap-2">
                  <span className="text-xs bg-white/[0.04] text-gray-400 px-2 py-1 rounded-lg">{setup.timeframe}</span>
                  <span className="text-xs bg-white/[0.04] text-gray-400 px-2 py-1 rounded-lg">R:R {setup.riskReward}</span>
                </div>
              </button>
            ))}
          </div>

          {selectedSetup && renderSetup(selectedSetup)}
        </div>
      </main>
    </div>
  );
}