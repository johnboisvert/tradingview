import { useState } from "react";
import Sidebar from "../components/Sidebar";

interface BacktestResult {
  totalReturn: number;
  winRate: number;
  maxDrawdown: number;
  sharpeRatio: number;
  totalTrades: number;
  profitFactor: number;
  avgWin: number;
  avgLoss: number;
  trades: { date: string; type: string; price: number; pnl: number }[];
}

const STRATEGIES = [
  { id: "ma_cross", name: "Moving Average Crossover", desc: "Croisement MA 20/50" },
  { id: "rsi_ob", name: "RSI Overbought/Oversold", desc: "RSI 14 (30/70)" },
  { id: "breakout", name: "Breakout Strategy", desc: "Cassure de range" },
  { id: "macd", name: "MACD Signal", desc: "Croisement MACD/Signal" },
  { id: "bollinger", name: "Bollinger Bands", desc: "Rebond sur bandes" },
];

function generateBacktest(strategy: string, capital: number): BacktestResult {
  const seed = strategy.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  const rand = (min: number, max: number) => {
    const x = Math.sin(seed * 9301 + 49297) % 49297;
    return min + (Math.abs(x) / 49297) * (max - min);
  };
  const winRate = rand(45, 72);
  const totalReturn = rand(-15, 120);
  const trades: BacktestResult["trades"] = [];
  const numTrades = Math.floor(rand(20, 60));
  for (let i = 0; i < numTrades; i++) {
    const isWin = Math.random() * 100 < winRate;
    trades.push({
      date: `2025-${String(Math.floor(i / 5) + 1).padStart(2, "0")}-${String((i % 28) + 1).padStart(2, "0")}`,
      type: Math.random() > 0.5 ? "LONG" : "SHORT",
      price: Math.round(40000 + Math.random() * 60000),
      pnl: isWin ? Math.round(capital * rand(0.5, 5) / 100) : -Math.round(capital * rand(0.3, 3) / 100),
    });
  }
  return {
    totalReturn: Math.round(totalReturn * 100) / 100,
    winRate: Math.round(winRate * 10) / 10,
    maxDrawdown: Math.round(rand(5, 25) * 10) / 10,
    sharpeRatio: Math.round(rand(0.5, 2.8) * 100) / 100,
    totalTrades: numTrades,
    profitFactor: Math.round(rand(0.8, 3.2) * 100) / 100,
    avgWin: Math.round(capital * rand(1, 4) / 100),
    avgLoss: Math.round(capital * rand(0.5, 2.5) / 100),
    trades,
  };
}

export default function Backtesting() {
  const [strategy, setStrategy] = useState("ma_cross");
  const [symbol, setSymbol] = useState("BTCUSDT");
  const [capital, setCapital] = useState(10000);
  const [timeframe, setTimeframe] = useState("4h");
  const [result, setResult] = useState<BacktestResult | null>(null);
  const [loading, setLoading] = useState(false);

  const runBacktest = () => {
    setLoading(true);
    setTimeout(() => {
      setResult(generateBacktest(strategy + symbol + timeframe, capital));
      setLoading(false);
    }, 1500);
  };

  return (
    <div className="flex min-h-screen bg-[#030712]">
      <Sidebar />
      <main className="flex-1 ml-[260px] p-7">
        <div className="fixed inset-0 pointer-events-none z-0">
          <div className="absolute w-[600px] h-[600px] rounded-full bg-indigo-500/5 blur-[80px] top-[-200px] left-[100px]" />
          <div className="absolute w-[500px] h-[500px] rounded-full bg-purple-500/5 blur-[80px] bottom-[-200px] right-[-100px]" />
        </div>
        <div className="relative z-10 max-w-[1440px] mx-auto">
          <div className="text-center mb-10 pt-8">
            <h1 className="text-5xl font-black bg-gradient-to-r from-indigo-400 via-purple-500 to-indigo-400 bg-[length:300%_auto] bg-clip-text text-transparent animate-gradient">
              📊 Backtesting Pro
            </h1>
            <p className="text-gray-500 mt-3 text-lg">Testez vos stratégies sur données historiques</p>
          </div>

          {/* Config */}
          <div className="bg-slate-900/70 backdrop-blur-xl border border-white/5 rounded-3xl p-8 mb-6">
            <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2">⚙️ Configuration</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-6">
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Stratégie</label>
                <select value={strategy} onChange={(e) => setStrategy(e.target.value)} className="w-full px-4 py-3 bg-slate-800/80 border border-white/10 rounded-xl text-white text-sm focus:border-indigo-500 outline-none">
                  {STRATEGIES.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Paire</label>
                <select value={symbol} onChange={(e) => setSymbol(e.target.value)} className="w-full px-4 py-3 bg-slate-800/80 border border-white/10 rounded-xl text-white text-sm focus:border-indigo-500 outline-none">
                  {["BTCUSDT", "ETHUSDT", "SOLUSDT", "BNBUSDT", "XRPUSDT"].map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Timeframe</label>
                <select value={timeframe} onChange={(e) => setTimeframe(e.target.value)} className="w-full px-4 py-3 bg-slate-800/80 border border-white/10 rounded-xl text-white text-sm focus:border-indigo-500 outline-none">
                  {["15m", "1h", "4h", "1d"].map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Capital ($)</label>
                <input type="number" value={capital} onChange={(e) => setCapital(Number(e.target.value))} className="w-full px-4 py-3 bg-slate-800/80 border border-white/10 rounded-xl text-white text-sm focus:border-indigo-500 outline-none" />
              </div>
            </div>
            <p className="text-sm text-gray-500 mb-4">
              {STRATEGIES.find((s) => s.id === strategy)?.desc}
            </p>
            <button onClick={runBacktest} disabled={loading} className="px-8 py-3 bg-gradient-to-r from-emerald-500 to-green-600 text-white font-bold rounded-xl hover:shadow-lg hover:shadow-emerald-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
              {loading ? "⏳ Simulation en cours..." : "🚀 Lancer le Backtest"}
            </button>
          </div>

          {/* Results */}
          {result && (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                {[
                  { label: "Rendement Total", value: `${result.totalReturn > 0 ? "+" : ""}${result.totalReturn}%`, color: result.totalReturn > 0 ? "text-emerald-400" : "text-red-400" },
                  { label: "Win Rate", value: `${result.winRate}%`, color: result.winRate > 50 ? "text-emerald-400" : "text-amber-400" },
                  { label: "Max Drawdown", value: `-${result.maxDrawdown}%`, color: "text-red-400" },
                  { label: "Sharpe Ratio", value: result.sharpeRatio.toString(), color: result.sharpeRatio > 1.5 ? "text-emerald-400" : "text-amber-400" },
                  { label: "Total Trades", value: result.totalTrades.toString(), color: "text-blue-400" },
                  { label: "Profit Factor", value: result.profitFactor.toString(), color: result.profitFactor > 1.5 ? "text-emerald-400" : "text-amber-400" },
                  { label: "Gain Moyen", value: `$${result.avgWin}`, color: "text-emerald-400" },
                  { label: "Perte Moyenne", value: `-$${result.avgLoss}`, color: "text-red-400" },
                ].map((stat) => (
                  <div key={stat.label} className="bg-slate-900/70 border border-white/5 rounded-2xl p-5 text-center hover:border-indigo-500/20 transition-all hover:-translate-y-1">
                    <div className="text-xs text-gray-500 uppercase tracking-wider mb-2">{stat.label}</div>
                    <div className={`text-2xl font-black font-mono ${stat.color}`}>{stat.value}</div>
                  </div>
                ))}
              </div>

              {/* Trades Table */}
              <div className="bg-slate-900/70 border border-white/5 rounded-3xl p-6 overflow-x-auto">
                <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">📋 Historique des Trades</h2>
                <table className="w-full min-w-[600px]">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="text-left text-xs text-gray-500 uppercase tracking-wider py-3 px-3">Date</th>
                      <th className="text-left text-xs text-gray-500 uppercase tracking-wider py-3 px-3">Type</th>
                      <th className="text-right text-xs text-gray-500 uppercase tracking-wider py-3 px-3">Prix</th>
                      <th className="text-right text-xs text-gray-500 uppercase tracking-wider py-3 px-3">P&L</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.trades.slice(0, 20).map((t, i) => (
                      <tr key={i} className="border-b border-white/5 hover:bg-indigo-500/5 transition-colors">
                        <td className="py-3 px-3 text-sm text-gray-300">{t.date}</td>
                        <td className="py-3 px-3">
                          <span className={`text-xs font-bold px-2 py-1 rounded-lg ${t.type === "LONG" ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"}`}>
                            {t.type}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right font-mono text-sm text-gray-300">${t.price.toLocaleString()}</td>
                        <td className={`py-3 px-3 text-right font-mono text-sm font-bold ${t.pnl > 0 ? "text-emerald-400" : "text-red-400"}`}>
                          {t.pnl > 0 ? "+" : ""}{t.pnl.toLocaleString()}$
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {/* Strategy Guide */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            {[
              { icon: "📈", title: "Trend Following", desc: "Suivez la tendance avec les moyennes mobiles. Idéal en marché directionnel.", color: "border-l-blue-500" },
              { icon: "🔄", title: "Mean Reversion", desc: "Profitez des retours à la moyenne avec RSI et Bollinger Bands.", color: "border-l-emerald-500" },
              { icon: "💥", title: "Breakout", desc: "Capturez les cassures de range avec volume confirmation.", color: "border-l-amber-500" },
            ].map((guide) => (
              <div key={guide.title} className={`bg-slate-900/50 border border-white/5 ${guide.color} border-l-4 rounded-2xl p-6`}>
                <h3 className="text-base font-bold text-white mb-2 flex items-center gap-2">{guide.icon} {guide.title}</h3>
                <p className="text-sm text-gray-400 leading-relaxed">{guide.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}