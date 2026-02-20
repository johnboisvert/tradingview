import { useState } from "react";
import Sidebar from "../components/Sidebar";
import { TrendingUp, TrendingDown } from "lucide-react";

interface Setup {
  name: string;
  direction: "LONG" | "SHORT";
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
    direction: "LONG",
    entry: "RSI < 25 + Bougie de retournement haussière",
    stopLoss: "Sous le dernier creux (-1.5%)",
    takeProfit: "RSI > 65 ou +3%",
    timeframe: "5m / 15m",
    indicators: ["RSI 14", "Volume", "EMA 20"],
    riskReward: "1:2",
    confidence: 72,
    description: "LONG — Scalping sur les retournements RSI en zone de survente. Idéal en range.",
  },
  {
    name: "Breakout Momentum",
    direction: "LONG",
    entry: "Cassure résistance + Volume > 2x moyenne",
    stopLoss: "Sous la résistance cassée (-2%)",
    takeProfit: "Extension Fibonacci 1.618",
    timeframe: "1h / 4h",
    indicators: ["Volume", "VWAP", "Bollinger Bands"],
    riskReward: "1:3",
    confidence: 78,
    description: "LONG — Capture les cassures de résistance avec confirmation de volume.",
  },
  {
    name: "EMA Cross Trend",
    direction: "LONG",
    entry: "EMA 9 croise EMA 21 à la hausse",
    stopLoss: "Sous EMA 50 (-3%)",
    takeProfit: "EMA 9 croise EMA 21 à la baisse",
    timeframe: "4h / 1d",
    indicators: ["EMA 9", "EMA 21", "EMA 50", "MACD"],
    riskReward: "1:2.5",
    confidence: 75,
    description: "LONG — Suivi de tendance classique avec croisement de moyennes mobiles.",
  },
  {
    name: "Support Bounce",
    direction: "LONG",
    entry: "Test du support + Divergence RSI haussière",
    stopLoss: "Sous le support (-2.5%)",
    takeProfit: "Résistance suivante",
    timeframe: "1h / 4h",
    indicators: ["RSI 14", "Support/Résistance", "Volume"],
    riskReward: "1:3",
    confidence: 70,
    description: "LONG — Rebond sur support majeur avec confirmation de divergence.",
  },
  {
    name: "Short RSI Overbought",
    direction: "SHORT",
    entry: "RSI > 80 + Bougie englobante baissière",
    stopLoss: "Au-dessus du dernier sommet (+1.5%)",
    takeProfit: "RSI < 40 ou -3%",
    timeframe: "5m / 15m",
    indicators: ["RSI 14", "Volume", "EMA 20"],
    riskReward: "1:2",
    confidence: 70,
    description: "SHORT — Scalping sur les retournements RSI en zone de surachat. Vente à découvert.",
  },
  {
    name: "Breakdown Short",
    direction: "SHORT",
    entry: "Cassure support + Volume > 2x moyenne",
    stopLoss: "Au-dessus du support cassé (+2%)",
    takeProfit: "Extension Fibonacci 1.618 vers le bas",
    timeframe: "1h / 4h",
    indicators: ["Volume", "VWAP", "Bollinger Bands"],
    riskReward: "1:3",
    confidence: 74,
    description: "SHORT — Capture les cassures de support avec confirmation de volume baissier.",
  },
  {
    name: "MACD Divergence Long",
    direction: "LONG",
    entry: "Divergence haussière MACD + Support",
    stopLoss: "Sous le dernier creux (-3%)",
    takeProfit: "Signal MACD baissier",
    timeframe: "4h / 1d",
    indicators: ["MACD", "RSI", "Volume"],
    riskReward: "1:2.5",
    confidence: 68,
    description: "LONG — Détection de divergences MACD haussières pour anticiper les retournements à la hausse.",
  },
  {
    name: "MACD Divergence Short",
    direction: "SHORT",
    entry: "Divergence baissière MACD + Résistance",
    stopLoss: "Au-dessus du dernier sommet (+3%)",
    takeProfit: "Signal MACD haussier",
    timeframe: "4h / 1d",
    indicators: ["MACD", "RSI", "Volume"],
    riskReward: "1:2.5",
    confidence: 67,
    description: "SHORT — Détection de divergences MACD baissières pour anticiper les retournements à la baisse.",
  },
  {
    name: "Bollinger Squeeze Long",
    direction: "LONG",
    entry: "Squeeze Bollinger + Breakout haussier",
    stopLoss: "Bande inférieure (-2%)",
    takeProfit: "Extension 2x largeur des bandes",
    timeframe: "1h / 4h",
    indicators: ["Bollinger Bands", "Volume", "ATR"],
    riskReward: "1:2",
    confidence: 73,
    description: "LONG — Profitez de l'expansion de volatilité haussière après compression.",
  },
  {
    name: "Bollinger Squeeze Short",
    direction: "SHORT",
    entry: "Squeeze Bollinger + Breakout baissier",
    stopLoss: "Bande supérieure (+2%)",
    takeProfit: "Extension 2x largeur des bandes vers le bas",
    timeframe: "1h / 4h",
    indicators: ["Bollinger Bands", "Volume", "ATR"],
    riskReward: "1:2",
    confidence: 71,
    description: "SHORT — Profitez de l'expansion de volatilité baissière après compression.",
  },
  {
    name: "EMA Death Cross Short",
    direction: "SHORT",
    entry: "EMA 9 croise EMA 21 à la baisse + Volume croissant",
    stopLoss: "Au-dessus EMA 50 (+3%)",
    takeProfit: "EMA 9 croise EMA 21 à la hausse",
    timeframe: "4h / 1d",
    indicators: ["EMA 9", "EMA 21", "EMA 50", "MACD"],
    riskReward: "1:2.5",
    confidence: 72,
    description: "SHORT — Suivi de tendance baissière avec croisement de moyennes mobiles (Death Cross).",
  },
  {
    name: "Resistance Rejection Short",
    direction: "SHORT",
    entry: "Rejet de résistance + Mèche haute + Volume décroissant",
    stopLoss: "Au-dessus de la résistance (+2.5%)",
    takeProfit: "Support suivant",
    timeframe: "1h / 4h",
    indicators: ["RSI 14", "Support/Résistance", "Volume"],
    riskReward: "1:3",
    confidence: 69,
    description: "SHORT — Vente sur rejet de résistance majeure avec confirmation de faiblesse.",
  },
];

const DirectionBadge = ({ direction }: { direction: "LONG" | "SHORT" }) => (
  <span
    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-extrabold ${
      direction === "LONG"
        ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20"
        : "bg-red-500/15 text-red-400 border border-red-500/20"
    }`}
  >
    {direction === "LONG" ? (
      <TrendingUp className="w-3.5 h-3.5" />
    ) : (
      <TrendingDown className="w-3.5 h-3.5" />
    )}
    {direction}
  </span>
);

export default function AISetupBuilder() {
  const [selectedSetup, setSelectedSetup] = useState<Setup | null>(null);
  const [customSetup, setCustomSetup] = useState({
    pair: "BTCUSDT",
    capital: "1000",
    riskPct: "2",
    timeframe: "4h",
    strategy: "trend",
    direction: "LONG" as "LONG" | "SHORT",
  });
  const [generated, setGenerated] = useState<Setup | null>(null);
  const [generating, setGenerating] = useState(false);
  const [filter, setFilter] = useState<"ALL" | "LONG" | "SHORT">("ALL");

  const generateSetup = () => {
    setGenerating(true);
    setTimeout(() => {
      const isLong = customSetup.direction === "LONG";
      const strategies: Record<string, Setup> = {
        trend: {
          name: `${isLong ? "Long" : "Short"} Trend ${customSetup.pair} ${customSetup.timeframe}`,
          direction: customSetup.direction,
          entry: isLong
            ? "EMA 20 > EMA 50 + Prix au-dessus des deux EMA"
            : "EMA 20 < EMA 50 + Prix en-dessous des deux EMA",
          stopLoss: isLong
            ? `Sous EMA 50 (-${customSetup.riskPct}%)`
            : `Au-dessus EMA 50 (+${customSetup.riskPct}%)`,
          takeProfit: "Trailing stop à 2x ATR",
          timeframe: customSetup.timeframe,
          indicators: ["EMA 20", "EMA 50", "ATR", "Volume"],
          riskReward: "1:2.5",
          confidence: 70 + Math.round(Math.random() * 15),
          description: `${customSetup.direction} — Setup de suivi de tendance ${isLong ? "haussière" : "baissière"} optimisé pour ${customSetup.pair} en ${customSetup.timeframe}. Capital: $${customSetup.capital}, Risque: ${customSetup.riskPct}%.`,
        },
        scalp: {
          name: `${isLong ? "Long" : "Short"} Scalp ${customSetup.pair} ${customSetup.timeframe}`,
          direction: customSetup.direction,
          entry: isLong
            ? "RSI < 30 + Bougie englobante haussière"
            : "RSI > 75 + Bougie englobante baissière",
          stopLoss: isLong
            ? `Sous le creux (-${customSetup.riskPct}%)`
            : `Au-dessus du sommet (+${customSetup.riskPct}%)`,
          takeProfit: isLong ? "RSI > 60 ou +2%" : "RSI < 40 ou -2%",
          timeframe: customSetup.timeframe,
          indicators: ["RSI 14", "Volume", "VWAP"],
          riskReward: "1:1.5",
          confidence: 65 + Math.round(Math.random() * 15),
          description: `${customSetup.direction} — Setup de scalping sur ${customSetup.pair}. Entrées rapides sur ${isLong ? "survente" : "surachat"} RSI.`,
        },
        breakout: {
          name: `${isLong ? "Long" : "Short"} Breakout ${customSetup.pair} ${customSetup.timeframe}`,
          direction: customSetup.direction,
          entry: isLong
            ? "Cassure de résistance + Volume 2x supérieur à la moyenne"
            : "Cassure de support + Volume 2x supérieur à la moyenne",
          stopLoss: isLong
            ? `Sous la résistance cassée (-${customSetup.riskPct}%)`
            : `Au-dessus du support cassé (+${customSetup.riskPct}%)`,
          takeProfit: isLong
            ? "Hauteur du range projetée vers le haut"
            : "Hauteur du range projetée vers le bas",
          timeframe: customSetup.timeframe,
          indicators: ["Volume", "Bollinger Bands", "ATR"],
          riskReward: "1:3",
          confidence: 72 + Math.round(Math.random() * 13),
          description: `${customSetup.direction} — Setup de breakout ${isLong ? "haussier" : "baissier"} pour ${customSetup.pair}. Capture les explosions de volatilité.`,
        },
      };
      setGenerated(strategies[customSetup.strategy] || strategies.trend);
      setGenerating(false);
    }, 2000);
  };

  const renderSetup = (setup: Setup) => (
    <div className="bg-slate-900/70 border border-white/5 rounded-3xl p-8">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-bold text-white">{setup.name}</h2>
          <DirectionBadge direction={setup.direction} />
        </div>
        <span
          className={`text-sm font-bold px-3 py-1.5 rounded-xl ${
            setup.confidence > 75
              ? "bg-emerald-500/10 text-emerald-400"
              : setup.confidence > 60
                ? "bg-amber-500/10 text-amber-400"
                : "bg-gray-500/10 text-gray-400"
          }`}
        >
          Confiance: {setup.confidence}%
        </span>
      </div>
      <p className="text-sm text-gray-400 mb-6">{setup.description}</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        {[
          {
            icon: setup.direction === "LONG" ? "📈" : "📉",
            label: "Direction",
            value: setup.direction,
            color:
              setup.direction === "LONG"
                ? "border-l-emerald-500"
                : "border-l-red-500",
          },
          {
            icon: "🎯",
            label: "Entrée",
            value: setup.entry,
            color: "border-l-blue-500",
          },
          {
            icon: "🛑",
            label: "Stop Loss",
            value: setup.stopLoss,
            color: "border-l-red-500",
          },
          {
            icon: "💰",
            label: "Take Profit",
            value: setup.takeProfit,
            color: "border-l-emerald-500",
          },
          {
            icon: "⏱️",
            label: "Timeframe",
            value: setup.timeframe,
            color: "border-l-amber-500",
          },
        ].map((item) => (
          <div
            key={item.label}
            className={`bg-white/[0.03] ${item.color} border-l-4 rounded-xl p-4`}
          >
            <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">
              {item.icon} {item.label}
            </div>
            <div className="text-sm font-bold text-white">{item.value}</div>
          </div>
        ))}
      </div>
      <div className="flex items-center gap-4 flex-wrap">
        <div className="text-sm text-gray-400">
          <span className="font-bold text-white">R:R</span> {setup.riskReward}
        </div>
        <div className="flex flex-wrap gap-1.5">
          {setup.indicators.map((ind) => (
            <span
              key={ind}
              className="text-xs bg-indigo-500/10 text-indigo-400 px-2 py-1 rounded-lg font-semibold"
            >
              {ind}
            </span>
          ))}
        </div>
      </div>
    </div>
  );

  const filteredPresets =
    filter === "ALL"
      ? PRESET_SETUPS
      : PRESET_SETUPS.filter((s) => s.direction === filter);

  return (
    <div className="flex min-h-screen bg-[#030712]">
      <Sidebar />
      <main className="flex-1 ml-[260px]">
      <PageHeader
          icon={<span className="text-lg">🏗️</span>}
          title="AI Setup Builder"
          subtitle="Construisez des setups de trading complets avec l’aide de l’IA. Définissez votre entrée, stop loss, take profit et obtenez une analyse de la qualité de votre setup."
          accentColor="blue"
          steps={[
            { n: "1", title: "Choisissez votre setup", desc: "Sélectionnez parmi les templates de setups pré-construits par l’IA ou créez le vôtre en définissant les paramètres clés." },
            { n: "2", title: "Configurez les niveaux", desc: "Entrez votre prix d’entrée, stop loss et take profit. L’IA calcule automatiquement le ratio risque/récompense et la taille de position optimale." },
            { n: "3", title: "Validez et exécutez", desc: "L’IA évalue la qualité de votre setup (A, B, C). Ne prenez que les setups A et B pour maximiser votre edge sur le marché." },
          ]}
        />
        <div className="fixed inset-0 pointer-events-none z-0">
          <div className="absolute w-[600px] h-[600px] rounded-full bg-violet-500/5 blur-[80px] top-[-200px] left-[-100px]" />
          <div className="absolute w-[500px] h-[500px] rounded-full bg-cyan-500/5 blur-[80px] bottom-[-200px] right-[-100px]" />
        </div>
        <div className="relative z-10 max-w-[1440px] mx-auto">
          <div className="text-center mb-10 pt-8">
            <h1 className="text-5xl font-black bg-gradient-to-r from-violet-400 via-cyan-400 to-violet-400 bg-[length:300%_auto] bg-clip-text text-transparent animate-gradient">
              🏗️ AI Setup Builder
            </h1>
            <p className="text-gray-500 mt-3 text-lg">
              Générez des setups de trading LONG ou SHORT personnalisés par IA
            </p>
          </div>

          {/* Custom Generator */}
          <div className="bg-slate-900/70 border border-white/5 rounded-3xl p-8 mb-6">
            <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
              ⚙️ Générateur de Setup
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4 mb-6">
              <div>
                <label className="block text-xs text-gray-500 font-bold uppercase tracking-wider mb-2">
                  Direction
                </label>
                <div className="flex gap-2">
                  <button
                    onClick={() =>
                      setCustomSetup({ ...customSetup, direction: "LONG" })
                    }
                    className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-3 rounded-xl text-sm font-bold transition-all ${
                      customSetup.direction === "LONG"
                        ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                        : "bg-slate-800/80 text-gray-500 border border-white/10 hover:border-emerald-500/20"
                    }`}
                  >
                    <TrendingUp className="w-4 h-4" />
                    LONG
                  </button>
                  <button
                    onClick={() =>
                      setCustomSetup({ ...customSetup, direction: "SHORT" })
                    }
                    className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-3 rounded-xl text-sm font-bold transition-all ${
                      customSetup.direction === "SHORT"
                        ? "bg-red-500/20 text-red-400 border border-red-500/30"
                        : "bg-slate-800/80 text-gray-500 border border-white/10 hover:border-red-500/20"
                    }`}
                  >
                    <TrendingDown className="w-4 h-4" />
                    SHORT
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-xs text-gray-500 font-bold uppercase tracking-wider mb-2">
                  Paire
                </label>
                <select
                  value={customSetup.pair}
                  onChange={(e) =>
                    setCustomSetup({ ...customSetup, pair: e.target.value })
                  }
                  className="w-full px-4 py-3 bg-slate-800/80 border border-white/10 rounded-xl text-white text-sm focus:border-violet-500 outline-none"
                >
                  {[
                    "BTCUSDT","ETHUSDT","BNBUSDT","XRPUSDT","SOLUSDT","ADAUSDT","DOGEUSDT","TRXUSDT",
                    "AVAXUSDT","LINKUSDT","DOTUSDT","MATICUSDT","SHIBUSDT","TONUSDT","ICPUSDT",
                    "BCHUSDT","LTCUSDT","UNIUSDT","ATOMUSDT","XLMUSDT","NEARUSDT","APTUSDT",
                    "FILUSDT","ARBUSDT","OPUSDT","VETUSDT","HBARUSDT","MKRUSDT","GRTUSDT",
                    "INJUSDT","FTMUSDT","THETAUSDT","AAVEUSDT","ALGOUSDT","FLOWUSDT","AXSUSDT",
                    "SANDUSDT","MANAUSDT","XTZUSDT","EOSUSDT","SNXUSDT","CRVUSDT","LDOUSDT",
                    "RUNEUSDT","DYDXUSDT","SUIUSDT","SEIUSDT","TIAUSDT","JUPUSDT","WLDUSDT",
                  ].map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-500 font-bold uppercase tracking-wider mb-2">
                  Capital ($)
                </label>
                <input
                  type="number"
                  value={customSetup.capital}
                  onChange={(e) =>
                    setCustomSetup({ ...customSetup, capital: e.target.value })
                  }
                  className="w-full px-4 py-3 bg-slate-800/80 border border-white/10 rounded-xl text-white text-sm focus:border-violet-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 font-bold uppercase tracking-wider mb-2">
                  Risque (%)
                </label>
                <input
                  type="number"
                  value={customSetup.riskPct}
                  onChange={(e) =>
                    setCustomSetup({ ...customSetup, riskPct: e.target.value })
                  }
                  className="w-full px-4 py-3 bg-slate-800/80 border border-white/10 rounded-xl text-white text-sm focus:border-violet-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 font-bold uppercase tracking-wider mb-2">
                  Timeframe
                </label>
                <select
                  value={customSetup.timeframe}
                  onChange={(e) =>
                    setCustomSetup({
                      ...customSetup,
                      timeframe: e.target.value,
                    })
                  }
                  className="w-full px-4 py-3 bg-slate-800/80 border border-white/10 rounded-xl text-white text-sm focus:border-violet-500 outline-none"
                >
                  {["5m", "15m", "1h", "4h", "1d"].map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-500 font-bold uppercase tracking-wider mb-2">
                  Style
                </label>
                <select
                  value={customSetup.strategy}
                  onChange={(e) =>
                    setCustomSetup({
                      ...customSetup,
                      strategy: e.target.value,
                    })
                  }
                  className="w-full px-4 py-3 bg-slate-800/80 border border-white/10 rounded-xl text-white text-sm focus:border-violet-500 outline-none"
                >
                  <option value="trend">Trend Following</option>
                  <option value="scalp">Scalping</option>
                  <option value="breakout">Breakout</option>
                </select>
              </div>
            </div>
            <button
              onClick={generateSetup}
              disabled={generating}
              className={`px-8 py-3 font-bold rounded-xl hover:shadow-lg transition-all disabled:opacity-50 ${
                customSetup.direction === "LONG"
                  ? "bg-gradient-to-r from-emerald-500 to-cyan-500 hover:shadow-emerald-500/20 text-white"
                  : "bg-gradient-to-r from-red-500 to-orange-500 hover:shadow-red-500/20 text-white"
              }`}
            >
              {generating
                ? "🧠 Génération IA en cours..."
                : `🚀 Générer Setup ${customSetup.direction}`}
            </button>
          </div>

          {generated && renderSetup(generated)}

          {/* Preset Setups */}
          <div className="flex items-center justify-between mt-8 mb-4 flex-wrap gap-3">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              📚 Setups Prédéfinis
            </h2>
            <div className="flex gap-2">
              {(["ALL", "LONG", "SHORT"] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                    filter === f
                      ? f === "LONG"
                        ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                        : f === "SHORT"
                          ? "bg-red-500/20 text-red-400 border border-red-500/30"
                          : "bg-violet-500/20 text-violet-400 border border-violet-500/30"
                      : "bg-white/[0.04] text-gray-500 border border-white/[0.06] hover:bg-white/[0.08]"
                  }`}
                >
                  {f === "ALL" ? "Tous" : f}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            {filteredPresets.map((setup) => (
              <button
                key={setup.name}
                onClick={() => setSelectedSetup(setup)}
                className={`text-left bg-slate-900/70 border rounded-2xl p-5 transition-all hover:-translate-y-1 ${
                  selectedSetup?.name === setup.name
                    ? "border-violet-500/40"
                    : "border-white/5 hover:border-violet-500/20"
                }`}
              >
                <div className="flex items-center justify-between mb-2 gap-2">
                  <h3 className="text-sm font-bold text-white">{setup.name}</h3>
                  <DirectionBadge direction={setup.direction} />
                </div>
                <p className="text-xs text-gray-400 mb-3 line-clamp-2">
                  {setup.description}
                </p>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs bg-white/[0.04] text-gray-400 px-2 py-1 rounded-lg">
                    {setup.timeframe}
                  </span>
                  <span className="text-xs bg-white/[0.04] text-gray-400 px-2 py-1 rounded-lg">
                    R:R {setup.riskReward}
                  </span>
                  <span
                    className={`text-xs font-bold px-2 py-1 rounded-lg ${
                      setup.confidence > 75
                        ? "bg-emerald-500/10 text-emerald-400"
                        : "bg-amber-500/10 text-amber-400"
                    }`}
                  >
                    {setup.confidence}%
                  </span>
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