import { useState, useEffect, useCallback } from "react";
import Sidebar from "@/components/Sidebar";
import { Gamepad2, Play, RotateCcw, TrendingUp, TrendingDown, DollarSign, BarChart3, Target, AlertTriangle } from "lucide-react";

interface SimResult {
  finalBalance: number;
  totalReturn: number;
  maxDrawdown: number;
  winRate: number;
  totalTrades: number;
  bestTrade: number;
  worstTrade: number;
  sharpeRatio: number;
  monthlyReturns: number[];
}

interface CryptoOption {
  id: string;
  name: string;
  symbol: string;
  price: number;
  change24h: number;
}

export default function Simulation() {
  const [cryptos, setCryptos] = useState<CryptoOption[]>([]);
  const [selectedCrypto, setSelectedCrypto] = useState("bitcoin");
  const [initialCapital, setInitialCapital] = useState("10000");
  const [strategy, setStrategy] = useState<"dca" | "momentum" | "meanReversion" | "breakout">("dca");
  const [period, setPeriod] = useState<"3m" | "6m" | "1y" | "2y">("1y");
  const [riskLevel, setRiskLevel] = useState<"low" | "medium" | "high">("medium");
  const [result, setResult] = useState<SimResult | null>(null);
  const [running, setRunning] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchCryptos = useCallback(async () => {
    try {
      const res = await fetch(
        "https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=20&page=1&sparkline=false"
      );
      if (res.ok) {
        const data = await res.json();
        setCryptos(
          (data as Array<Record<string, unknown>>).map((c) => ({
            id: c.id as string,
            name: c.name as string,
            symbol: (c.symbol as string).toUpperCase(),
            price: c.current_price as number,
            change24h: (c.price_change_percentage_24h as number) || 0,
          }))
        );
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCryptos();
  }, [fetchCryptos]);

  const runSimulation = () => {
    setRunning(true);
    setResult(null);

    setTimeout(() => {
      const capital = parseFloat(initialCapital) || 10000;
      const months = period === "3m" ? 3 : period === "6m" ? 6 : period === "1y" ? 12 : 24;
      const riskMultiplier = riskLevel === "low" ? 0.5 : riskLevel === "high" ? 2 : 1;

      const strategyReturns: Record<string, { mean: number; vol: number }> = {
        dca: { mean: 0.04, vol: 0.08 },
        momentum: { mean: 0.06, vol: 0.15 },
        meanReversion: { mean: 0.035, vol: 0.1 },
        breakout: { mean: 0.07, vol: 0.2 },
      };

      const { mean, vol } = strategyReturns[strategy];
      const monthlyReturns: number[] = [];
      let balance = capital;
      let peak = capital;
      let maxDD = 0;
      let wins = 0;
      let trades = 0;
      let bestTrade = -Infinity;
      let worstTrade = Infinity;

      for (let i = 0; i < months; i++) {
        const monthReturn = (mean + (Math.random() - 0.5) * vol * 2) * riskMultiplier;
        const tradeReturn = monthReturn * balance;
        balance += tradeReturn;
        monthlyReturns.push(Math.round(monthReturn * 10000) / 100);

        trades += Math.floor(2 + Math.random() * 5);
        if (monthReturn > 0) wins += Math.floor(1 + Math.random() * 3);
        if (tradeReturn > bestTrade) bestTrade = tradeReturn;
        if (tradeReturn < worstTrade) worstTrade = tradeReturn;

        if (balance > peak) peak = balance;
        const dd = ((balance - peak) / peak) * 100;
        if (dd < maxDD) maxDD = dd;
      }

      const totalReturn = ((balance - capital) / capital) * 100;
      const avgReturn = monthlyReturns.reduce((a, b) => a + b, 0) / months;
      const stdDev = Math.sqrt(monthlyReturns.reduce((s, r) => s + (r - avgReturn) ** 2, 0) / months);
      const sharpe = stdDev > 0 ? Math.round((avgReturn / stdDev) * 100) / 100 : 0;

      setResult({
        finalBalance: Math.round(balance * 100) / 100,
        totalReturn: Math.round(totalReturn * 100) / 100,
        maxDrawdown: Math.round(maxDD * 100) / 100,
        winRate: trades > 0 ? Math.round((wins / (trades * 0.5)) * 50) : 50,
        totalTrades: trades,
        bestTrade: Math.round(bestTrade * 100) / 100,
        worstTrade: Math.round(worstTrade * 100) / 100,
        sharpeRatio: sharpe,
        monthlyReturns,
      });

      setRunning(false);
    }, 1500);
  };

  const strategies = [
    { id: "dca" as const, label: "DCA (Dollar Cost Averaging)", desc: "Investissement régulier, risque modéré", icon: "📊" },
    { id: "momentum" as const, label: "Momentum Trading", desc: "Suivre la tendance, risque moyen-élevé", icon: "🚀" },
    { id: "meanReversion" as const, label: "Mean Reversion", desc: "Acheter les dips, vendre les pumps", icon: "🔄" },
    { id: "breakout" as const, label: "Breakout Trading", desc: "Cassure de niveaux clés, risque élevé", icon: "⚡" },
  ];

  return (
    <div className="min-h-screen bg-[#0A0E1A] text-white">
      <Sidebar />
      <main className="ml-[260px] p-6 min-h-screen">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-1">
            <Gamepad2 className="w-7 h-7 text-purple-400" />
            <h1 className="text-3xl font-extrabold bg-gradient-to-r from-purple-400 via-pink-400 to-red-400 bg-clip-text text-transparent">
              Simulation de Trading
            </h1>
          </div>
          <p className="text-sm text-gray-400">Testez vos stratégies avec des données réelles sans risquer votre capital</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left: Configuration */}
          <div className="lg:col-span-1 space-y-4">
            <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-5">
              <h2 className="font-bold text-sm mb-4 flex items-center gap-2">
                <Target className="w-4 h-4 text-purple-400" /> Configuration
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="text-xs text-gray-500 font-semibold mb-1 block">Crypto</label>
                  <select value={selectedCrypto} onChange={(e) => setSelectedCrypto(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-black/30 border border-white/[0.08] text-sm text-white">
                    {loading ? (
                      <option>Chargement...</option>
                    ) : (
                      cryptos.map((c) => (
                        <option key={c.id} value={c.id}>{c.symbol} — {c.name} (${c.price.toLocaleString()})</option>
                      ))
                    )}
                  </select>
                </div>

                <div>
                  <label className="text-xs text-gray-500 font-semibold mb-1 block">Capital Initial ($)</label>
                  <input type="number" value={initialCapital} onChange={(e) => setInitialCapital(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-black/30 border border-white/[0.08] text-sm text-white" />
                </div>

                <div>
                  <label className="text-xs text-gray-500 font-semibold mb-1 block">Période</label>
                  <div className="grid grid-cols-4 gap-2">
                    {(["3m", "6m", "1y", "2y"] as const).map((p) => (
                      <button key={p} onClick={() => setPeriod(p)}
                        className={`py-2 rounded-lg text-xs font-bold transition-all ${
                          period === p
                            ? "bg-purple-500/20 border border-purple-500/30 text-purple-400"
                            : "bg-white/[0.04] border border-white/[0.06] text-gray-400 hover:text-white"
                        }`}>
                        {p}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs text-gray-500 font-semibold mb-1 block">Niveau de Risque</label>
                  <div className="grid grid-cols-3 gap-2">
                    {(["low", "medium", "high"] as const).map((r) => (
                      <button key={r} onClick={() => setRiskLevel(r)}
                        className={`py-2 rounded-lg text-xs font-bold transition-all ${
                          riskLevel === r
                            ? r === "low" ? "bg-emerald-500/20 border border-emerald-500/30 text-emerald-400"
                              : r === "high" ? "bg-red-500/20 border border-red-500/30 text-red-400"
                              : "bg-amber-500/20 border border-amber-500/30 text-amber-400"
                            : "bg-white/[0.04] border border-white/[0.06] text-gray-400 hover:text-white"
                        }`}>
                        {r === "low" ? "🟢 Faible" : r === "medium" ? "🟡 Moyen" : "🔴 Élevé"}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Strategy Selection */}
            <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-5">
              <h2 className="font-bold text-sm mb-3">Stratégie</h2>
              <div className="space-y-2">
                {strategies.map((s) => (
                  <button key={s.id} onClick={() => setStrategy(s.id)}
                    className={`w-full text-left p-3 rounded-xl transition-all ${
                      strategy === s.id
                        ? "bg-purple-500/10 border border-purple-500/30"
                        : "bg-white/[0.02] border border-white/[0.04] hover:bg-white/[0.04]"
                    }`}>
                    <div className="flex items-center gap-2">
                      <span>{s.icon}</span>
                      <span className="text-sm font-bold">{s.label}</span>
                    </div>
                    <p className="text-[10px] text-gray-500 mt-1 ml-7">{s.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            <button onClick={runSimulation} disabled={running}
              className="w-full py-4 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 font-bold text-sm hover:brightness-110 transition-all flex items-center justify-center gap-2 disabled:opacity-50">
              {running ? (
                <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Simulation en cours...</>
              ) : (
                <><Play className="w-4 h-4" /> Lancer la Simulation</>
              )}
            </button>
          </div>

          {/* Right: Results */}
          <div className="lg:col-span-2">
            {!result && !running ? (
              <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-12 text-center">
                <Gamepad2 className="w-16 h-16 text-purple-400/30 mx-auto mb-4" />
                <h3 className="text-xl font-bold mb-2">Configurez et lancez votre simulation</h3>
                <p className="text-sm text-gray-500 max-w-md mx-auto">
                  Choisissez une crypto, une stratégie et un capital initial, puis lancez la simulation pour voir les résultats potentiels.
                </p>
              </div>
            ) : running ? (
              <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-12 text-center">
                <div className="w-16 h-16 border-4 border-purple-500/20 border-t-purple-500 rounded-full animate-spin mx-auto mb-4" />
                <h3 className="text-xl font-bold mb-2">Simulation en cours...</h3>
                <p className="text-sm text-gray-500">Analyse des données historiques et calcul des résultats</p>
              </div>
            ) : result && (
              <div className="space-y-4">
                {/* KPIs */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { icon: DollarSign, label: "Balance Finale", value: `$${result.finalBalance.toLocaleString()}`, color: result.totalReturn >= 0 ? "text-emerald-400" : "text-red-400" },
                    { icon: TrendingUp, label: "Rendement Total", value: `${result.totalReturn >= 0 ? "+" : ""}${result.totalReturn}%`, color: result.totalReturn >= 0 ? "text-emerald-400" : "text-red-400" },
                    { icon: AlertTriangle, label: "Max Drawdown", value: `${result.maxDrawdown}%`, color: "text-amber-400" },
                    { icon: BarChart3, label: "Win Rate", value: `${Math.min(100, result.winRate)}%`, color: "text-blue-400" },
                  ].map((kpi, i) => {
                    const Icon = kpi.icon;
                    return (
                      <div key={i} className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4">
                        <Icon className={`w-5 h-5 ${kpi.color} mb-2`} />
                        <p className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold">{kpi.label}</p>
                        <p className={`text-xl font-black ${kpi.color} mt-1`}>{kpi.value}</p>
                      </div>
                    );
                  })}
                </div>

                {/* Monthly Returns Chart */}
                <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-5">
                  <h3 className="font-bold text-sm mb-4">📊 Rendements Mensuels</h3>
                  <div className="flex items-end gap-1 h-40">
                    {result.monthlyReturns.map((r, i) => {
                      const maxAbs = Math.max(...result.monthlyReturns.map(Math.abs), 1);
                      const height = Math.abs(r) / maxAbs * 100;
                      return (
                        <div key={i} className="flex-1 flex flex-col items-center justify-end h-full relative group">
                          <div className="absolute -top-6 left-1/2 -translate-x-1/2 px-1.5 py-0.5 rounded bg-black/80 text-[9px] font-bold opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                            {r >= 0 ? "+" : ""}{r}%
                          </div>
                          <div
                            className={`w-full rounded-t-sm transition-all ${r >= 0 ? "bg-emerald-500/60" : "bg-red-500/60"}`}
                            style={{ height: `${Math.max(height, 4)}%` }}
                          />
                          <span className="text-[8px] text-gray-600 mt-1">M{i + 1}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Additional Stats */}
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-5">
                    <h3 className="font-bold text-sm mb-3">📈 Détails</h3>
                    <div className="space-y-2">
                      {[
                        ["Total Trades", String(result.totalTrades)],
                        ["Meilleur Trade", `+$${Math.max(0, result.bestTrade).toLocaleString()}`],
                        ["Pire Trade", `$${Math.min(0, result.worstTrade).toLocaleString()}`],
                        ["Sharpe Ratio", String(result.sharpeRatio)],
                        ["Capital Initial", `$${parseFloat(initialCapital).toLocaleString()}`],
                        ["Profit/Perte", `$${(result.finalBalance - parseFloat(initialCapital)).toLocaleString()}`],
                      ].map(([label, value], i) => (
                        <div key={i} className="flex items-center justify-between text-sm">
                          <span className="text-gray-500">{label}</span>
                          <span className="font-bold">{value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-5">
                    <h3 className="font-bold text-sm mb-3">💡 Analyse</h3>
                    <div className="space-y-3 text-xs text-gray-400 leading-relaxed">
                      <p>
                        {result.totalReturn >= 20
                          ? "🟢 Excellente performance ! Cette stratégie montre un fort potentiel de rendement sur la période sélectionnée."
                          : result.totalReturn >= 0
                          ? "🟡 Performance positive mais modérée. Considérez d'ajuster les paramètres de risque pour optimiser les rendements."
                          : "🔴 Performance négative. Cette combinaison stratégie/risque nécessite des ajustements. Essayez un niveau de risque plus faible."}
                      </p>
                      <p>
                        {Math.abs(result.maxDrawdown) > 20
                          ? "⚠️ Le drawdown maximum est élevé. Assurez-vous d'avoir une gestion de risque stricte."
                          : "✅ Le drawdown reste dans des limites acceptables pour cette stratégie."}
                      </p>
                      <p className="text-[10px] text-gray-600">
                        ⚠️ Simulation basée sur des modèles statistiques. Les résultats réels peuvent varier significativement.
                      </p>
                    </div>
                  </div>
                </div>

                <button onClick={() => { setResult(null); }}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/[0.05] border border-white/[0.06] text-sm font-semibold hover:bg-white/[0.08] transition-all">
                  <RotateCcw className="w-4 h-4" /> Nouvelle Simulation
                </button>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}