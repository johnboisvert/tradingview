import { useState } from "react";
import Sidebar from "../components/Sidebar";
import PageHeader from "@/components/PageHeader";
import { BarChart3, RefreshCw, TrendingUp, TrendingDown } from "lucide-react";
import Footer from "@/components/Footer";
import {
  fetchBinanceKlines,
  runBacktest,
  STRATEGY_MAP,
  BINANCE_SYMBOLS,
  TIMEFRAMES,
  type BacktestResult,
} from "@/lib/backtestEngine";

const STRATEGIES = Object.entries(STRATEGY_MAP).map(([id, s]) => ({
  id,
  name: s.name,
  desc: s.desc,
}));

export default function Backtesting() {
  const [strategy, setStrategy] = useState("ma_cross");
  const [symbol, setSymbol] = useState("BTCUSDT");
  const [capital, setCapital] = useState(10000);
  const [timeframe, setTimeframe] = useState("4h");
  const [result, setResult] = useState<BacktestResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runTest = async () => {
    setLoading(true);
    setError(null);
    try {
      const tf = TIMEFRAMES.find((t) => t.value === timeframe);
      const candles = await fetchBinanceKlines(symbol, timeframe, tf?.limit || 500);
      if (candles.length < 60) {
        throw new Error("Pas assez de données historiques pour cette paire/timeframe");
      }
      const res = runBacktest(candles, strategy, capital);
      setResult(res);
    } catch (err: any) {
      console.error("Backtest error:", err);
      setError(err.message || "Erreur lors du chargement des données Binance");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-[#030712]">
      <Sidebar />
      <main className="flex-1 md:ml-[260px] p-4 md:p-7 pt-[72px] md:pt-7 bg-[#030712]">
        <PageHeader
          icon={<BarChart3 className="w-6 h-6" />}
          title="Backtesting de Stratégies"
          subtitle="Testez vos stratégies sur des données historiques RÉELLES de Binance. Chaque trade est calculé à partir des vrais prix passés — aucune simulation aléatoire."
          accentColor="indigo"
          steps={[
            { n: "1", title: "Configurez votre stratégie", desc: "Choisissez la paire, le timeframe, le capital et la stratégie. Les données sont chargées en temps réel depuis Binance." },
            { n: "2", title: "Lancez le backtest", desc: "L'algorithme applique la stratégie sur les vrais prix historiques et génère les trades réels." },
            { n: "3", title: "Analysez les résultats", desc: "Win rate, drawdown, Sharpe ratio et chaque trade individuel — tout est basé sur des données vérifiables." },
          ]}
        />
        <div className="fixed inset-0 pointer-events-none z-0">
          <div className="absolute w-[600px] h-[600px] rounded-full bg-indigo-500/5 blur-[80px] top-[-200px] left-[100px]" />
          <div className="absolute w-[500px] h-[500px] rounded-full bg-purple-500/5 blur-[80px] bottom-[-200px] right-[-100px]" />
        </div>
        <div className="relative z-10 max-w-[1440px] mx-auto">
          <div className="text-center mb-10 pt-8">
            <h1 className="text-5xl font-black bg-gradient-to-r from-indigo-400 via-purple-500 to-indigo-400 bg-[length:300%_auto] bg-clip-text text-transparent animate-gradient">
              📊 Backtesting Pro
            </h1>
            <p className="text-gray-500 mt-3 text-lg">Données historiques réelles Binance — Aucune donnée simulée</p>
            <div className="inline-flex items-center gap-2 mt-3 bg-emerald-500/10 border border-emerald-500/25 rounded-full px-5 py-1.5 text-xs text-emerald-400 font-bold uppercase tracking-widest">
              <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#22c55e]" />
              DONNÉES RÉELLES — Binance API
            </div>
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
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Paire (Binance)</label>
                <select value={symbol} onChange={(e) => setSymbol(e.target.value)} className="w-full px-4 py-3 bg-slate-800/80 border border-white/10 rounded-xl text-white text-sm focus:border-indigo-500 outline-none">
                  {BINANCE_SYMBOLS.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Timeframe</label>
                <select value={timeframe} onChange={(e) => setTimeframe(e.target.value)} className="w-full px-4 py-3 bg-slate-800/80 border border-white/10 rounded-xl text-white text-sm focus:border-indigo-500 outline-none">
                  {TIMEFRAMES.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Capital ($)</label>
                <input type="number" value={capital} onChange={(e) => setCapital(Number(e.target.value))} className="w-full px-4 py-3 bg-slate-800/80 border border-white/10 rounded-xl text-white text-sm focus:border-indigo-500 outline-none" />
              </div>
            </div>
            <div className="flex items-center gap-4 flex-wrap">
              <p className="text-sm text-gray-500">
                📋 {STRATEGIES.find((s) => s.id === strategy)?.desc}
              </p>
              <p className="text-xs text-gray-600 ml-auto">
                Position: 10% du capital par trade
              </p>
            </div>
            <button onClick={runTest} disabled={loading} className="mt-4 px-8 py-3 bg-gradient-to-r from-emerald-500 to-green-600 text-white font-bold rounded-xl hover:shadow-lg hover:shadow-emerald-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2">
              {loading ? (
                <><RefreshCw className="w-4 h-4 animate-spin" /> Chargement des données Binance...</>
              ) : (
                <>🚀 Lancer le Backtest</>
              )}
            </button>
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-6 text-center mb-6">
              <p className="text-red-400 font-semibold mb-2">❌ {error}</p>
              <p className="text-gray-500 text-sm">Vérifiez que la paire existe sur Binance ou essayez un autre timeframe.</p>
            </div>
          )}

          {/* Results */}
          {result && (
            <>
              {/* Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                {[
                  { label: "Rendement Total", value: `${result.totalReturn > 0 ? "+" : ""}${result.totalReturn}%`, color: result.totalReturn > 0 ? "text-emerald-400" : "text-red-400" },
                  { label: "Win Rate", value: `${result.winRate}%`, color: result.winRate > 50 ? "text-emerald-400" : "text-amber-400" },
                  { label: "Max Drawdown", value: `-${result.maxDrawdown}%`, color: "text-red-400" },
                  { label: "Sharpe Ratio", value: result.sharpeRatio.toString(), color: result.sharpeRatio > 1 ? "text-emerald-400" : "text-amber-400" },
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

              {/* Equity Curve (SVG) */}
              <div className="bg-slate-900/70 border border-white/5 rounded-3xl p-6 mb-6">
                <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">📈 Courbe de Capital (Stratégie vs Buy &amp; Hold)</h2>
                <EquityChart data={result.equityCurve} />
                <div className="flex items-center gap-6 mt-3 pt-3 border-t border-white/5">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-1 bg-indigo-500 rounded" />
                    <span className="text-xs text-gray-400">Stratégie</span>
                    <span className={`text-xs font-bold ${result.equityCurve[result.equityCurve.length - 1].equity >= result.equityCurve[0].equity ? "text-emerald-400" : "text-red-400"}`}>
                      ${result.equityCurve[result.equityCurve.length - 1].equity.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-1 bg-cyan-500 rounded" style={{ borderStyle: "dashed" }} />
                    <span className="text-xs text-gray-400">Buy &amp; Hold</span>
                    <span className={`text-xs font-bold ${result.equityCurve[result.equityCurve.length - 1].buyHold >= result.equityCurve[0].buyHold ? "text-emerald-400" : "text-red-400"}`}>
                      ${result.equityCurve[result.equityCurve.length - 1].buyHold.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Trades Table */}
              <div className="bg-slate-900/70 border border-white/5 rounded-3xl p-6 overflow-x-auto mb-6">
                <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">📋 Historique des Trades ({result.trades.length} trades réels)</h2>
                {result.trades.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <p className="text-sm">Aucun signal détecté pour cette stratégie sur cette période.</p>
                    <p className="text-xs mt-2">Essayez un autre timeframe ou une autre paire.</p>
                  </div>
                ) : (
                  <table className="w-full min-w-[800px]">
                    <thead>
                      <tr className="border-b border-white/10">
                        <th className="text-left text-xs text-gray-500 uppercase tracking-wider py-3 px-3">#</th>
                        <th className="text-left text-xs text-gray-500 uppercase tracking-wider py-3 px-3">Type</th>
                        <th className="text-left text-xs text-gray-500 uppercase tracking-wider py-3 px-3">Entrée</th>
                        <th className="text-left text-xs text-gray-500 uppercase tracking-wider py-3 px-3">Sortie</th>
                        <th className="text-right text-xs text-gray-500 uppercase tracking-wider py-3 px-3">Prix Entrée</th>
                        <th className="text-right text-xs text-gray-500 uppercase tracking-wider py-3 px-3">Prix Sortie</th>
                        <th className="text-right text-xs text-gray-500 uppercase tracking-wider py-3 px-3">P&amp;L</th>
                        <th className="text-right text-xs text-gray-500 uppercase tracking-wider py-3 px-3">P&amp;L %</th>
                        <th className="text-left text-xs text-gray-500 uppercase tracking-wider py-3 px-3">Raison</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.trades.map((t) => (
                        <tr key={t.id} className="border-b border-white/5 hover:bg-indigo-500/5 transition-colors">
                          <td className="py-3 px-3 text-sm text-gray-500 font-semibold">{t.id}</td>
                          <td className="py-3 px-3">
                            <span className={`text-xs font-bold px-2 py-1 rounded-lg flex items-center gap-1 w-fit ${t.type === "LONG" ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"}`}>
                              {t.type === "LONG" ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                              {t.type}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-sm text-gray-300">{t.entryDate}</td>
                          <td className="py-3 px-3 text-sm text-gray-300">{t.exitDate}</td>
                          <td className="py-3 px-3 text-right font-mono text-sm text-gray-300">${t.entryPrice.toLocaleString()}</td>
                          <td className="py-3 px-3 text-right font-mono text-sm text-gray-300">${t.exitPrice.toLocaleString()}</td>
                          <td className={`py-3 px-3 text-right font-mono text-sm font-bold ${t.profitable ? "text-emerald-400" : "text-red-400"}`}>
                            {t.pnl > 0 ? "+" : ""}{t.pnl.toLocaleString()}$
                          </td>
                          <td className={`py-3 px-3 text-right font-mono text-sm font-bold ${t.profitable ? "text-emerald-400" : "text-red-400"}`}>
                            {t.pnlPct > 0 ? "+" : ""}{t.pnlPct}%
                          </td>
                          <td className="py-3 px-3 text-xs text-gray-500 max-w-[200px] truncate" title={t.reason}>{t.reason}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>

              {/* Disclaimer */}
              <div className="bg-amber-500/[0.06] border border-amber-500/15 rounded-2xl p-6 text-center mb-6">
                <p className="text-sm text-amber-300/80">
                  ⚠️ <strong>Avertissement :</strong> Les performances passées ne garantissent pas les résultats futurs. Ce backtest utilise les données historiques réelles de Binance.
                  Les frais de trading, le slippage et la liquidité ne sont pas pris en compte. Ceci ne constitue pas un conseil financier.
                </p>
              </div>
            </>
          )}

          {/* Strategy Guide */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            {[
              { icon: "📈", title: "Trend Following", desc: "Suivez la tendance avec les moyennes mobiles. Golden cross (MA20 > MA50) = achat, Death cross = vente.", color: "border-l-blue-500" },
              { icon: "🔄", title: "Mean Reversion", desc: "Profitez des retours à la moyenne avec RSI et Bollinger Bands. Achat en survente, vente en surachat.", color: "border-l-emerald-500" },
              { icon: "💥", title: "Breakout", desc: "Capturez les cassures du plus haut 20 périodes avec confirmation par le volume.", color: "border-l-amber-500" },
            ].map((guide) => (
              <div key={guide.title} className={`bg-slate-900/50 border border-white/5 ${guide.color} border-l-4 rounded-2xl p-6`}>
                <h3 className="text-base font-bold text-white mb-2 flex items-center gap-2">{guide.icon} {guide.title}</h3>
                <p className="text-sm text-gray-400 leading-relaxed">{guide.desc}</p>
              </div>
            ))}
          </div>
        </div>
        <Footer />
      </main>
    </div>
  );
}

// ─── Equity Chart Component ────────────────────────────────────────────────

function EquityChart({ data }: { data: BacktestResult["equityCurve"] }) {
  if (data.length === 0) return null;

  const W = 800;
  const H = 200;
  const PAD = { top: 16, right: 20, bottom: 28, left: 60 };

  const allVals = [...data.map((d) => d.equity), ...data.map((d) => d.buyHold)];
  const minV = Math.min(...allVals) * 0.98;
  const maxV = Math.max(...allVals) * 1.02;

  const toX = (i: number) => PAD.left + (i / (data.length - 1)) * (W - PAD.left - PAD.right);
  const toY = (v: number) => PAD.top + ((maxV - v) / (maxV - minV)) * (H - PAD.top - PAD.bottom);

  const stratPath = data.map((d, i) => `${i === 0 ? "M" : "L"}${toX(i).toFixed(1)},${toY(d.equity).toFixed(1)}`).join(" ");
  const bhPath = data.map((d, i) => `${i === 0 ? "M" : "L"}${toX(i).toFixed(1)},${toY(d.buyHold).toFixed(1)}`).join(" ");

  const yTicks = 4;
  const yLabels = Array.from({ length: yTicks + 1 }, (_, i) => {
    const val = minV + ((maxV - minV) * i) / yTicks;
    return { val, y: toY(val) };
  });

  const step = Math.max(1, Math.floor(data.length / 6));

  return (
    <div className="w-full overflow-x-auto">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ minWidth: "340px" }}>
        <defs>
          <linearGradient id="eqGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#6366f1" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#6366f1" stopOpacity="0.02" />
          </linearGradient>
        </defs>
        {yLabels.map((l, i) => (
          <g key={i}>
            <line x1={PAD.left} y1={l.y} x2={W - PAD.right} y2={l.y} stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
            <text x={PAD.left - 6} y={l.y + 4} textAnchor="end" fontSize="9" fill="rgba(255,255,255,0.3)">
              ${l.val.toFixed(0)}
            </text>
          </g>
        ))}
        {data.filter((_, i) => i % step === 0 || i === data.length - 1).map((d, i) => {
          const idx = data.indexOf(d);
          return (
            <text key={i} x={toX(idx)} y={H - 4} textAnchor="middle" fontSize="8" fill="rgba(255,255,255,0.25)">
              {d.date}
            </text>
          );
        })}
        <path d={`${stratPath} L${toX(data.length - 1).toFixed(1)},${(H - PAD.bottom).toFixed(1)} L${PAD.left},${(H - PAD.bottom).toFixed(1)} Z`} fill="url(#eqGrad)" />
        <path d={stratPath} fill="none" stroke="#6366f1" strokeWidth="2" />
        <path d={bhPath} fill="none" stroke="#22d3ee" strokeWidth="1.5" strokeDasharray="4,3" opacity="0.7" />
      </svg>
    </div>
  );
}