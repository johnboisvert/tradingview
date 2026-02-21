import { useState, useMemo, useCallback } from "react";
import Sidebar from "@/components/Sidebar";
import PageHeader from "@/components/PageHeader";
import Footer from "@/components/Footer";
import {
  Activity,
  Play,
  TrendingUp,
  TrendingDown,
  BarChart2,
  ArrowUpRight,
  ArrowDownRight,
  Target,
  Loader2,
  Filter,
  ChevronDown,
  Search,
} from "lucide-react";
import {
  fetchBinanceKlines,
  runBacktest,
  STRATEGY_MAP,
  BINANCE_SYMBOLS,
  TIMEFRAMES,
  type BacktestResult,
} from "@/lib/backtestEngine";

// ─── Types ────────────────────────────────────────────────────────────────────

const STRATEGIES_LIST = Object.entries(STRATEGY_MAP).map(([id, s]) => ({
  id,
  name: s.name,
  desc: s.desc,
}));

const INITIAL_CAPITAL = 10000;

// ─── SVG Chart ────────────────────────────────────────────────────────────────

function PriceChart({
  data,
  trades,
  showComparison,
}: {
  data: BacktestResult["equityCurve"];
  trades: BacktestResult["trades"];
  showComparison: boolean;
}) {
  const W = 800;
  const H = 220;
  const PAD = { top: 16, right: 20, bottom: 28, left: 56 };

  if (data.length === 0) return null;

  const toX = (i: number) => PAD.left + (i / (data.length - 1)) * (W - PAD.left - PAD.right);

  if (showComparison) {
    const allVals = [...data.map((d) => d.equity), ...data.map((d) => d.buyHold)];
    const minV = Math.min(...allVals) * 0.98;
    const maxV = Math.max(...allVals) * 1.02;
    const toY = (v: number) => PAD.top + ((maxV - v) / (maxV - minV)) * (H - PAD.top - PAD.bottom);

    const stratPath = data.map((d, i) => `${i === 0 ? "M" : "L"}${toX(i).toFixed(1)},${toY(d.equity).toFixed(1)}`).join(" ");
    const bhPath = data.map((d, i) => `${i === 0 ? "M" : "L"}${toX(i).toFixed(1)},${toY(d.buyHold).toFixed(1)}`).join(" ");

    const yTicks = 4;
    const yLabels = Array.from({ length: yTicks + 1 }, (_, i) => {
      const val = minV + ((maxV - minV) * i) / yTicks;
      return { val, y: toY(val) };
    });

    return (
      <div className="w-full overflow-x-auto">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ minWidth: "340px" }}>
          {yLabels.map((l, i) => (
            <g key={i}>
              <line x1={PAD.left} y1={l.y} x2={W - PAD.right} y2={l.y} stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
              <text x={PAD.left - 6} y={l.y + 4} textAnchor="end" fontSize="9" fill="rgba(255,255,255,0.3)">${l.val.toFixed(0)}</text>
            </g>
          ))}
          <path d={bhPath} fill="none" stroke="#22d3ee" strokeWidth="1.5" strokeDasharray="4,3" opacity="0.7" />
          <path d={stratPath} fill="none" stroke="#a78bfa" strokeWidth="2" />
          <g>
            <line x1={PAD.left + 4} y1={PAD.top + 8} x2={PAD.left + 20} y2={PAD.top + 8} stroke="#a78bfa" strokeWidth="2" />
            <text x={PAD.left + 24} y={PAD.top + 12} fontSize="9" fill="#a78bfa">Stratégie</text>
            <line x1={PAD.left + 80} y1={PAD.top + 8} x2={PAD.left + 96} y2={PAD.top + 8} stroke="#22d3ee" strokeWidth="1.5" strokeDasharray="4,3" />
            <text x={PAD.left + 100} y={PAD.top + 12} fontSize="9" fill="#22d3ee">Buy &amp; Hold</text>
          </g>
        </svg>
      </div>
    );
  }

  // Price chart with trade signals
  const prices = data.map((d) => d.price);
  const minP = Math.min(...prices) * 0.97;
  const maxP = Math.max(...prices) * 1.03;
  const toY = (v: number) => PAD.top + ((maxP - v) / (maxP - minP)) * (H - PAD.top - PAD.bottom);

  const pricePath = data.map((d, i) => `${i === 0 ? "M" : "L"}${toX(i).toFixed(1)},${toY(d.price).toFixed(1)}`).join(" ");
  const areaPath = `${pricePath} L${toX(data.length - 1).toFixed(1)},${(H - PAD.bottom).toFixed(1)} L${PAD.left},${(H - PAD.bottom).toFixed(1)} Z`;

  const yTicks = 4;
  const yLabels = Array.from({ length: yTicks + 1 }, (_, i) => {
    const val = minP + ((maxP - minP) * i) / yTicks;
    return { val, y: toY(val) };
  });

  const step = Math.max(1, Math.floor(data.length / 6));

  // Map trade entry dates to chart indices
  const entryDateMap = new Map<string, { type: string; price: number }>();
  const exitDateMap = new Map<string, { type: string; price: number; profitable: boolean }>();
  for (const t of trades) {
    entryDateMap.set(t.entryDate, { type: t.type, price: t.entryPrice });
    exitDateMap.set(t.exitDate, { type: t.type, price: t.exitPrice, profitable: t.profitable });
  }

  return (
    <div className="w-full overflow-x-auto">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ minWidth: "340px" }}>
        <defs>
          <linearGradient id="priceGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#6366f1" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#6366f1" stopOpacity="0.02" />
          </linearGradient>
        </defs>
        {yLabels.map((l, i) => (
          <g key={i}>
            <line x1={PAD.left} y1={l.y} x2={W - PAD.right} y2={l.y} stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
            <text x={PAD.left - 6} y={l.y + 4} textAnchor="end" fontSize="9" fill="rgba(255,255,255,0.3)">
              {l.val >= 1000 ? `$${(l.val / 1000).toFixed(1)}k` : `$${l.val.toFixed(4)}`}
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
        <path d={areaPath} fill="url(#priceGrad)" />
        <path d={pricePath} fill="none" stroke="#6366f1" strokeWidth="1.8" />
        {/* Trade entry signals */}
        {data.map((d, i) => {
          const entry = entryDateMap.get(d.date);
          if (!entry) return null;
          return (
            <g key={`entry-${i}`}>
              <polygon
                points={`${toX(i)},${toY(d.price) - 18} ${toX(i) - 6},${toY(d.price) - 8} ${toX(i) + 6},${toY(d.price) - 8}`}
                fill="#22c55e"
                opacity="0.9"
              />
              <line x1={toX(i)} y1={PAD.top} x2={toX(i)} y2={H - PAD.bottom} stroke="#22c55e" strokeWidth="1" strokeDasharray="3,3" opacity="0.3" />
            </g>
          );
        })}
        {/* Trade exit signals */}
        {data.map((d, i) => {
          const exit = exitDateMap.get(d.date);
          if (!exit) return null;
          return (
            <g key={`exit-${i}`}>
              <polygon
                points={`${toX(i)},${toY(d.price) + 18} ${toX(i) - 6},${toY(d.price) + 8} ${toX(i) + 6},${toY(d.price) + 8}`}
                fill={exit.profitable ? "#22c55e" : "#ef4444"}
                opacity="0.9"
              />
              <line x1={toX(i)} y1={PAD.top} x2={toX(i)} y2={H - PAD.bottom} stroke={exit.profitable ? "#22c55e" : "#ef4444"} strokeWidth="1" strokeDasharray="3,3" opacity="0.3" />
            </g>
          );
        })}
      </svg>
    </div>
  );
}

// ─── Stat Card ────────────────────────────────────────────────────────────────

function StatCard({ label, value, sub, positive, icon }: { label: string; value: string; sub?: string; positive?: boolean; icon: React.ReactNode }) {
  return (
    <div className="p-4 rounded-xl bg-black/20 border border-white/[0.05] hover:border-indigo-500/20 transition-all">
      <div className="flex items-center gap-2 mb-2">
        <div className="w-6 h-6 rounded-lg bg-indigo-500/15 flex items-center justify-center text-indigo-400">{icon}</div>
        <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">{label}</p>
      </div>
      <p className={`text-xl font-black ${positive === undefined ? "text-white" : positive ? "text-emerald-400" : "text-red-400"}`}>{value}</p>
      {sub && <p className="text-[10px] text-gray-600 mt-0.5">{sub}</p>}
    </div>
  );
}

// ─── Searchable Crypto Dropdown ───────────────────────────────────────────────

function CryptoDropdown({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return BINANCE_SYMBOLS.filter((s) => s.toLowerCase().includes(q)).slice(0, 50);
  }, [search]);

  return (
    <div className="relative">
      <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider mb-1.5">Paire (Binance)</p>
      <button
        onClick={() => { setOpen((o) => !o); setSearch(""); }}
        className="flex items-center justify-between gap-2 w-full px-3 py-2.5 rounded-xl bg-black/30 border border-white/[0.08] hover:border-indigo-500/30 text-sm font-semibold text-white transition-all min-w-[160px]"
      >
        <span>{value}</span>
        <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform flex-shrink-0 ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="absolute z-30 top-full mt-1 left-0 w-[260px] bg-[#111827] border border-white/[0.08] rounded-xl overflow-hidden shadow-2xl">
          <div className="p-2 border-b border-white/[0.06]">
            <div className="flex items-center gap-2 px-2 py-1.5 bg-black/30 rounded-lg">
              <Search className="w-3.5 h-3.5 text-gray-500 flex-shrink-0" />
              <input
                autoFocus
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Rechercher une paire..."
                className="flex-1 bg-transparent text-xs text-white placeholder-gray-600 outline-none"
              />
            </div>
          </div>
          <div className="overflow-y-auto max-h-[240px]">
            {filtered.length === 0 && (
              <p className="text-xs text-gray-500 text-center py-4">Aucun résultat</p>
            )}
            {filtered.map((s) => (
              <button
                key={s}
                onClick={() => { onChange(s); setOpen(false); setSearch(""); }}
                className={`w-full text-left px-3 py-2 text-xs font-semibold transition-all hover:bg-indigo-500/10 ${s === value ? "text-indigo-400 bg-indigo-500/5" : "text-gray-300"}`}
              >
                {s}
              </button>
            ))}
          </div>
          <div className="px-3 py-1.5 border-t border-white/[0.06] text-[10px] text-gray-600 text-center">
            {BINANCE_SYMBOLS.length} paires disponibles
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Generic Dropdown ─────────────────────────────────────────────────────────

function Dropdown<T extends string | number>({
  label, value, options, onChange,
}: {
  label: string;
  value: T;
  options: { label: string; value: T }[];
  onChange: (v: T) => void;
}) {
  const [open, setOpen] = useState(false);
  const current = options.find((o) => o.value === value);
  return (
    <div className="relative">
      <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider mb-1.5">{label}</p>
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center justify-between gap-2 w-full px-3 py-2.5 rounded-xl bg-black/30 border border-white/[0.08] hover:border-indigo-500/30 text-sm font-semibold text-white transition-all min-w-[140px]"
      >
        <span>{current?.label}</span>
        <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="absolute z-20 top-full mt-1 left-0 w-full min-w-[160px] bg-[#111827] border border-white/[0.08] rounded-xl overflow-hidden shadow-2xl">
          {options.map((opt) => (
            <button
              key={String(opt.value)}
              onClick={() => { onChange(opt.value); setOpen(false); }}
              className={`w-full text-left px-3 py-2 text-xs font-semibold transition-all hover:bg-indigo-500/10 ${opt.value === value ? "text-indigo-400 bg-indigo-500/5" : "text-gray-300"}`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function BacktestingVisuel() {
  const [selectedSymbol, setSelectedSymbol] = useState("BTCUSDT");
  const [selectedTimeframe, setSelectedTimeframe] = useState("4h");
  const [selectedStrategy, setSelectedStrategy] = useState("ma_cross");
  const [isLoading, setIsLoading] = useState(false);
  const [hasRun, setHasRun] = useState(false);
  const [showComparison, setShowComparison] = useState(false);
  const [result, setResult] = useState<BacktestResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const tfLabel = useMemo(() => TIMEFRAMES.find((t) => t.value === selectedTimeframe)?.label ?? "", [selectedTimeframe]);
  const stratLabel = useMemo(() => STRATEGIES_LIST.find((s) => s.id === selectedStrategy)?.name ?? "", [selectedStrategy]);

  const runTest = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const tf = TIMEFRAMES.find((t) => t.value === selectedTimeframe);
      const candles = await fetchBinanceKlines(selectedSymbol, selectedTimeframe, tf?.limit || 500);
      if (candles.length < 60) {
        throw new Error("Pas assez de données historiques pour cette paire/timeframe");
      }
      const data = runBacktest(candles, selectedStrategy, INITIAL_CAPITAL);
      setResult(data);
      setHasRun(true);
    } catch (err: any) {
      console.error("Backtest error:", err);
      setError(err.message || "Erreur lors du chargement des données Binance");
    } finally {
      setIsLoading(false);
    }
  }, [selectedSymbol, selectedTimeframe, selectedStrategy]);

  const stats = result
    ? {
        winRate: result.winRate,
        totalGainUSD: result.trades.reduce((s, t) => s + t.pnl, 0),
        totalGainPct: result.totalReturn,
        avgGainPerTrade: result.trades.length > 0 ? Math.round((result.trades.reduce((s, t) => s + t.pnl, 0) / result.trades.length) * 100) / 100 : 0,
        maxDrawdown: result.maxDrawdown,
        riskReward: result.profitFactor,
        winCount: result.trades.filter((t) => t.profitable).length,
        lossCount: result.trades.filter((t) => !t.profitable).length,
        totalTrades: result.totalTrades,
        buyHoldGainPct: result.equityCurve.length > 0
          ? Math.round(((result.equityCurve[result.equityCurve.length - 1].buyHold - INITIAL_CAPITAL) / INITIAL_CAPITAL) * 10000) / 100
          : 0,
        strategyFinalValue: result.equityCurve.length > 0 ? result.equityCurve[result.equityCurve.length - 1].equity : INITIAL_CAPITAL,
        buyHoldFinalValue: result.equityCurve.length > 0 ? result.equityCurve[result.equityCurve.length - 1].buyHold : INITIAL_CAPITAL,
      }
    : null;

  return (
    <div className="min-h-screen bg-[#030712] text-white">
      <Sidebar />
      <main className="md:ml-[260px] pt-14 md:pt-0 bg-[#030712]">
        <div className="max-w-[1440px] mx-auto px-4 md:px-6 py-6">
          <PageHeader
            icon={<Activity className="w-6 h-6" />}
            title="Backtesting Visuel — Données Réelles Binance"
            subtitle={`Simulez les performances historiques de 5 stratégies sur ${BINANCE_SYMBOLS.length} paires Binance. Toutes les données sont réelles — aucune simulation aléatoire.`}
            accentColor="purple"
            steps={[
              { n: "1", title: "Sélectionnez une paire et un timeframe", desc: `Choisissez parmi ${BINANCE_SYMBOLS.length} paires Binance et 4 timeframes. Les données sont chargées en temps réel.` },
              { n: "2", title: "Choisissez une stratégie et lancez", desc: "L'algorithme applique la stratégie sur les vrais prix historiques Binance et génère les trades réels." },
              { n: "3", title: "Analysez les performances", desc: "Consultez le taux de réussite, le gain total, le drawdown et comparez la stratégie vs Buy & Hold." },
            ]}
          />

          {/* ── Config Panel ── */}
          <div className="bg-slate-900/50 border border-white/[0.07] rounded-2xl p-5 mb-5">
            <div className="flex items-center gap-2 mb-4">
              <Filter className="w-4 h-4 text-indigo-400" />
              <span className="text-xs font-black text-white uppercase tracking-widest">Configuration du Backtesting</span>
              <span className="ml-auto text-[10px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full font-bold">
                📡 Données réelles Binance
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
              <CryptoDropdown value={selectedSymbol} onChange={setSelectedSymbol} />
              <Dropdown
                label="Timeframe"
                value={selectedTimeframe}
                options={TIMEFRAMES.map((t) => ({ label: t.label, value: t.value }))}
                onChange={setSelectedTimeframe}
              />
              <Dropdown
                label="Stratégie"
                value={selectedStrategy}
                options={STRATEGIES_LIST.map((s) => ({ label: s.name, value: s.id }))}
                onChange={setSelectedStrategy}
              />
              <button
                onClick={runTest}
                disabled={isLoading}
                className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:brightness-110 transition-all disabled:opacity-60 disabled:cursor-not-allowed font-black text-sm shadow-lg shadow-indigo-500/20 h-[42px]"
              >
                {isLoading ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Chargement Binance...</>
                ) : (
                  <><Play className="w-4 h-4" /> Lancer le Backtesting</>
                )}
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-3">
              📋 {STRATEGIES_LIST.find((s) => s.id === selectedStrategy)?.desc} — Position: 10% du capital ($1,000) par trade
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-6 text-center mb-5">
              <p className="text-red-400 font-semibold mb-2">❌ {error}</p>
              <p className="text-gray-500 text-sm">Vérifiez que la paire existe sur Binance ou essayez un autre timeframe.</p>
            </div>
          )}

          {/* ── Loading ── */}
          {isLoading && (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <div className="relative w-16 h-16">
                <div className="absolute inset-0 rounded-full border-2 border-indigo-500/20" />
                <div className="absolute inset-0 rounded-full border-2 border-t-indigo-500 animate-spin" />
                <Activity className="absolute inset-0 m-auto w-6 h-6 text-indigo-400" />
              </div>
              <p className="text-sm text-gray-400 font-semibold">Chargement des données Binance...</p>
              <p className="text-xs text-gray-600">{selectedSymbol} • {tfLabel} • {stratLabel}</p>
            </div>
          )}

          {/* ── Empty State ── */}
          {!isLoading && !hasRun && (
            <div className="flex flex-col items-center justify-center py-20 gap-4 bg-slate-900/30 border border-white/[0.05] rounded-2xl">
              <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                <BarChart2 className="w-8 h-8 text-indigo-400" />
              </div>
              <p className="text-base font-black text-white">Prêt pour le backtesting</p>
              <p className="text-sm text-gray-500 text-center max-w-md">
                Configurez vos paramètres ci-dessus et cliquez sur <span className="text-indigo-400 font-bold">&quot;Lancer le Backtesting&quot;</span> pour tester une stratégie sur les vrais prix Binance.
              </p>
              <p className="text-xs text-gray-600">{BINANCE_SYMBOLS.length} paires Binance • 5 stratégies • Données 100% réelles</p>
            </div>
          )}

          {/* ── Results ── */}
          {!isLoading && hasRun && result && stats && (
            <div className="space-y-5">
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-3">
                <StatCard label="Taux de réussite" value={`${stats.winRate}%`} positive={stats.winRate >= 50} icon={<Target className="w-3.5 h-3.5" />} />
                <StatCard label="Gain total $" value={`${stats.totalGainUSD >= 0 ? "+" : ""}$${stats.totalGainUSD.toFixed(2)}`} positive={stats.totalGainUSD >= 0} icon={<TrendingUp className="w-3.5 h-3.5" />} />
                <StatCard label="Gain total %" value={`${stats.totalGainPct >= 0 ? "+" : ""}${stats.totalGainPct}%`} positive={stats.totalGainPct >= 0} icon={<BarChart2 className="w-3.5 h-3.5" />} />
                <StatCard label="Gain moyen/trade" value={`${stats.avgGainPerTrade >= 0 ? "+" : ""}$${stats.avgGainPerTrade}`} positive={stats.avgGainPerTrade >= 0} icon={<Activity className="w-3.5 h-3.5" />} />
                <StatCard label="Drawdown max" value={`-${stats.maxDrawdown}%`} positive={stats.maxDrawdown < 15} icon={<TrendingDown className="w-3.5 h-3.5" />} />
                <StatCard label="Profit Factor" value={`${stats.riskReward}x`} positive={stats.riskReward >= 1} icon={<Filter className="w-3.5 h-3.5" />} />
                <StatCard
                  label="Trades W/L"
                  value={`${stats.winCount}W / ${stats.lossCount}L`}
                  sub={`${stats.totalTrades} trades total`}
                  icon={<ArrowUpRight className="w-3.5 h-3.5" />}
                />
              </div>

              <div className="bg-slate-900/40 border border-white/[0.07] rounded-2xl p-5">
                <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                  <div>
                    <p className="text-xs font-black text-white uppercase tracking-widest">
                      {showComparison ? "Comparaison : Stratégie vs Buy & Hold" : `Prix ${selectedSymbol} — Signaux de Trading`}
                    </p>
                    <p className="text-[10px] text-gray-500 mt-0.5">
                      {selectedSymbol} • {tfLabel} • {stratLabel} • Capital initial : $10,000
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setShowComparison(false)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${!showComparison ? "bg-indigo-500/20 text-indigo-400 border border-indigo-500/30" : "text-gray-500 hover:text-gray-300"}`}
                    >
                      Signaux
                    </button>
                    <button
                      onClick={() => setShowComparison(true)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${showComparison ? "bg-indigo-500/20 text-indigo-400 border border-indigo-500/30" : "text-gray-500 hover:text-gray-300"}`}
                    >
                      Comparaison
                    </button>
                  </div>
                </div>
                <PriceChart data={result.equityCurve} trades={result.trades} showComparison={showComparison} />

                {!showComparison && (
                  <div className="flex items-center gap-4 mt-3 pt-3 border-t border-white/[0.05]">
                    <div className="flex items-center gap-1.5">
                      <div className="w-0 h-0 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-b-[8px] border-b-emerald-500" />
                      <span className="text-[10px] text-gray-400 font-semibold">Entrée (BUY)</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-0 h-0 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-t-[8px] border-t-red-500" />
                      <span className="text-[10px] text-gray-400 font-semibold">Sortie (SELL)</span>
                    </div>
                    <div className="flex items-center gap-1.5 ml-auto">
                      <span className="text-[10px] text-gray-500">{result.trades.length} trades réels</span>
                    </div>
                  </div>
                )}

                {showComparison && (
                  <div className="grid grid-cols-2 gap-3 mt-4">
                    <div className="p-3 rounded-xl bg-violet-500/10 border border-violet-500/20 text-center">
                      <p className="text-[10px] text-violet-400 font-bold mb-1">🤖 Stratégie</p>
                      <p className={`text-lg font-black ${stats.totalGainPct >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                        {stats.totalGainPct >= 0 ? "+" : ""}{stats.totalGainPct}%
                      </p>
                      <p className="text-[10px] text-gray-500">${stats.strategyFinalValue.toLocaleString("fr-FR")}</p>
                    </div>
                    <div className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-center">
                      <p className="text-[10px] text-cyan-400 font-bold mb-1">📈 Buy &amp; Hold</p>
                      <p className={`text-lg font-black ${stats.buyHoldGainPct >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                        {stats.buyHoldGainPct >= 0 ? "+" : ""}{stats.buyHoldGainPct}%
                      </p>
                      <p className="text-[10px] text-gray-500">${stats.buyHoldFinalValue.toFixed(0)}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Trades Table */}
              <div className="bg-slate-900/40 border border-white/[0.07] rounded-2xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <BarChart2 className="w-4 h-4 text-indigo-400" />
                    <span className="text-xs font-black text-white uppercase tracking-widest">Détail des Trades</span>
                  </div>
                  <span className="text-[10px] text-gray-500">{result.trades.length} trades</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-white/[0.06]">
                        {["#", "Type", "Entrée", "Sortie", "Prix Entrée", "Prix Sortie", "P&L $", "P&L %", "Raison"].map((h) => (
                          <th key={h} className="text-left py-2 px-2 text-[10px] text-gray-500 font-bold uppercase tracking-wider whitespace-nowrap">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {result.trades.map((trade) => (
                        <tr key={trade.id} className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-all">
                          <td className="py-2 px-2 text-gray-500 font-bold">{trade.id}</td>
                          <td className="py-2 px-2">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${trade.type === "LONG" ? "bg-emerald-500/15 text-emerald-400" : "bg-red-500/15 text-red-400"}`}>
                              {trade.type}
                            </span>
                          </td>
                          <td className="py-2 px-2 text-gray-400 whitespace-nowrap">{trade.entryDate}</td>
                          <td className="py-2 px-2 text-gray-400 whitespace-nowrap">{trade.exitDate}</td>
                          <td className="py-2 px-2 text-white font-semibold">${trade.entryPrice.toLocaleString()}</td>
                          <td className="py-2 px-2 text-white font-semibold">${trade.exitPrice.toLocaleString()}</td>
                          <td className={`py-2 px-2 font-black ${trade.profitable ? "text-emerald-400" : "text-red-400"}`}>
                            {trade.pnl >= 0 ? "+" : ""}${trade.pnl}
                          </td>
                          <td className={`py-2 px-2 font-black ${trade.profitable ? "text-emerald-400" : "text-red-400"}`}>
                            {trade.pnlPct >= 0 ? "+" : ""}{trade.pnlPct}%
                          </td>
                          <td className="py-2 px-2 text-gray-500 max-w-[200px] truncate" title={trade.reason}>{trade.reason}</td>
                        </tr>
                      ))}
                      {result.trades.length === 0 && (
                        <tr>
                          <td colSpan={9} className="py-8 text-center text-gray-500 text-xs">
                            Aucun trade détecté pour cette stratégie sur cette période. Essayez un autre timeframe ou une autre paire.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Win/Loss Summary */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/15">
                  <div className="flex items-center gap-2 mb-3">
                    <ArrowUpRight className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs font-black text-emerald-400 uppercase tracking-wider">Trades Gagnants</span>
                  </div>
                  <p className="text-3xl font-black text-emerald-400">{stats.winCount}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {stats.totalTrades > 0 ? ((stats.winCount / stats.totalTrades) * 100).toFixed(1) : 0}% du total
                  </p>
                </div>
                <div className="p-4 rounded-2xl bg-red-500/5 border border-red-500/15">
                  <div className="flex items-center gap-2 mb-3">
                    <ArrowDownRight className="w-4 h-4 text-red-400" />
                    <span className="text-xs font-black text-red-400 uppercase tracking-wider">Trades Perdants</span>
                  </div>
                  <p className="text-3xl font-black text-red-400">{stats.lossCount}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {stats.totalTrades > 0 ? ((stats.lossCount / stats.totalTrades) * 100).toFixed(1) : 0}% du total
                  </p>
                </div>
              </div>

              {/* Disclaimer */}
              <div className="bg-amber-500/[0.06] border border-amber-500/15 rounded-2xl p-6 text-center">
                <p className="text-sm text-amber-300/80">
                  ⚠️ <strong>Avertissement :</strong> Les performances passées ne garantissent pas les résultats futurs.
                  Ce backtest utilise les données historiques réelles de Binance (klines API).
                  Les frais de trading (~0.1%), le slippage et la liquidité ne sont pas pris en compte.
                  Ceci ne constitue pas un conseil financier. Faites toujours votre propre analyse (DYOR).
                </p>
              </div>
            </div>
          )}
        </div>
        <Footer />
      </main>
    </div>
  );
}