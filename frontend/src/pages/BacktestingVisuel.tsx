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
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface TradeSignal {
  id: number;
  entryDate: string;
  exitDate: string;
  entryPrice: number;
  exitPrice: number;
  type: "BUY" | "SELL";
  confidence: number;
  gainUSD: number;
  gainPct: number;
  durationDays: number;
  profitable: boolean;
}

interface BacktestStats {
  winRate: number;
  totalGainUSD: number;
  totalGainPct: number;
  avgGainPerTrade: number;
  maxDrawdown: number;
  riskReward: number;
  winCount: number;
  lossCount: number;
  totalTrades: number;
  buyHoldGainPct: number;
  strategyFinalValue: number;
  buyHoldFinalValue: number;
}

interface PricePoint {
  date: string;
  price: number;
  strategyValue: number;
  buyHoldValue: number;
  signal?: "BUY" | "SELL";
  signalProfit?: boolean;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const CRYPTOS = [
  { symbol: "BTC",  name: "Bitcoin",   basePrice: 42000, volatility: 0.04 },
  { symbol: "ETH",  name: "Ethereum",  basePrice: 2800,  volatility: 0.05 },
  { symbol: "SOL",  name: "Solana",    basePrice: 120,   volatility: 0.07 },
  { symbol: "BNB",  name: "BNB",       basePrice: 380,   volatility: 0.04 },
  { symbol: "AVAX", name: "Avalanche", basePrice: 35,    volatility: 0.08 },
  { symbol: "MATIC",name: "Polygon",   basePrice: 0.95,  volatility: 0.07 },
  { symbol: "LINK", name: "Chainlink", basePrice: 14,    volatility: 0.06 },
  { symbol: "DOT",  name: "Polkadot",  basePrice: 8.5,   volatility: 0.07 },
  { symbol: "ARB",  name: "Arbitrum",  basePrice: 1.2,   volatility: 0.09 },
  { symbol: "OP",   name: "Optimism",  basePrice: 2.1,   volatility: 0.09 },
];

const PERIODS = [
  { label: "1 mois",  days: 30  },
  { label: "3 mois",  days: 90  },
  { label: "6 mois",  days: 180 },
  { label: "1 an",    days: 365 },
  { label: "2 ans",   days: 730 },
];

const CONFIDENCE_THRESHOLDS = [
  { label: "50% minimum", value: 50 },
  { label: "70% minimum", value: 70 },
  { label: "90% minimum", value: 90 },
];

const SIGNAL_TYPES = [
  { label: "Tous les signaux", value: "ALL" },
  { label: "BUY uniquement",   value: "BUY" },
  { label: "SELL uniquement",  value: "SELL" },
];

const INITIAL_CAPITAL = 10000;

// ─── Seeded RNG (deterministic per crypto+period) ─────────────────────────────

function seededRng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0xffffffff;
  };
}

// ─── Data Generation ──────────────────────────────────────────────────────────

function generateBacktestData(
  cryptoSymbol: string,
  periodDays: number,
  signalFilter: string,
  confidenceMin: number
): { pricePoints: PricePoint[]; trades: TradeSignal[]; stats: BacktestStats } {
  const crypto = CRYPTOS.find((c) => c.symbol === cryptoSymbol)!;
  const seed = cryptoSymbol.charCodeAt(0) * 1000 + periodDays;
  const rng = seededRng(seed);

  // Generate price series
  const prices: number[] = [crypto.basePrice];
  for (let i = 1; i < periodDays; i++) {
    const change = (rng() - 0.48) * crypto.volatility;
    prices.push(Math.max(prices[i - 1] * (1 + change), crypto.basePrice * 0.3));
  }

  // Generate trade signals (roughly every 10-15 days)
  const rawTrades: TradeSignal[] = [];
  let tradeId = 1;
  let i = 5;
  while (i < periodDays - 10) {
    const gap = Math.floor(rng() * 12) + 8;
    const entryIdx = i;
    const exitIdx = Math.min(entryIdx + Math.floor(rng() * 8) + 3, periodDays - 1);
    const type: "BUY" | "SELL" = rng() > 0.35 ? "BUY" : "SELL";
    const confidence = Math.floor(rng() * 45) + 50; // 50-95%
    const entryPrice = prices[entryIdx];
    const exitPrice = prices[exitIdx];
    const rawGainPct = type === "BUY"
      ? ((exitPrice - entryPrice) / entryPrice) * 100
      : ((entryPrice - exitPrice) / entryPrice) * 100;
    const gainPct = parseFloat(rawGainPct.toFixed(2));
    const gainUSD = parseFloat(((INITIAL_CAPITAL * 0.1) * (gainPct / 100)).toFixed(2));

    const entryDate = new Date(Date.now() - (periodDays - entryIdx) * 86400000);
    const exitDate = new Date(Date.now() - (periodDays - exitIdx) * 86400000);

    rawTrades.push({
      id: tradeId++,
      entryDate: entryDate.toLocaleDateString("fr-FR"),
      exitDate: exitDate.toLocaleDateString("fr-FR"),
      entryPrice: parseFloat(entryPrice.toFixed(2)),
      exitPrice: parseFloat(exitPrice.toFixed(2)),
      type,
      confidence,
      gainUSD,
      gainPct,
      durationDays: exitIdx - entryIdx,
      profitable: gainPct > 0,
    });
    i += gap;
  }

  // Apply filters
  const trades = rawTrades.filter((t) => {
    if (signalFilter !== "ALL" && t.type !== signalFilter) return false;
    if (t.confidence < confidenceMin) return false;
    return true;
  });

  // Build price points with strategy curve
  let strategyValue = INITIAL_CAPITAL;
  const pricePoints: PricePoint[] = prices.map((price, idx) => {
    const date = new Date(Date.now() - (periodDays - idx) * 86400000);
    const trade = trades.find((t) => {
      const entryDate = new Date(Date.now() - (periodDays - (prices.indexOf(prices[idx]))) * 86400000);
      return t.entryDate === date.toLocaleDateString("fr-FR");
    });
    if (trade) strategyValue += trade.gainUSD;
    return {
      date: date.toLocaleDateString("fr-FR", { day: "2-digit", month: "short" }),
      price,
      strategyValue: Math.max(strategyValue, 0),
      buyHoldValue: INITIAL_CAPITAL * (price / prices[0]),
      signal: trade?.type,
      signalProfit: trade?.profitable,
    };
  });

  // Stats
  const winCount = trades.filter((t) => t.profitable).length;
  const lossCount = trades.length - winCount;
  const totalGainUSD = parseFloat(trades.reduce((s, t) => s + t.gainUSD, 0).toFixed(2));
  const totalGainPct = parseFloat(((totalGainUSD / INITIAL_CAPITAL) * 100).toFixed(2));
  const avgGainPerTrade = trades.length > 0 ? parseFloat((totalGainUSD / trades.length).toFixed(2)) : 0;
  const winRate = trades.length > 0 ? parseFloat(((winCount / trades.length) * 100).toFixed(1)) : 0;

  // Drawdown
  let peak = INITIAL_CAPITAL;
  let maxDrawdown = 0;
  pricePoints.forEach((p) => {
    if (p.strategyValue > peak) peak = p.strategyValue;
    const dd = ((peak - p.strategyValue) / peak) * 100;
    if (dd > maxDrawdown) maxDrawdown = dd;
  });

  const avgWin = trades.filter((t) => t.profitable).reduce((s, t) => s + t.gainPct, 0) / (winCount || 1);
  const avgLoss = Math.abs(trades.filter((t) => !t.profitable).reduce((s, t) => s + t.gainPct, 0) / (lossCount || 1));
  const riskReward = parseFloat((avgWin / (avgLoss || 1)).toFixed(2));

  const buyHoldFinalValue = INITIAL_CAPITAL * (prices[prices.length - 1] / prices[0]);
  const buyHoldGainPct = parseFloat((((buyHoldFinalValue - INITIAL_CAPITAL) / INITIAL_CAPITAL) * 100).toFixed(2));
  const strategyFinalValue = pricePoints[pricePoints.length - 1]?.strategyValue ?? INITIAL_CAPITAL;

  return {
    pricePoints,
    trades,
    stats: {
      winRate,
      totalGainUSD,
      totalGainPct,
      avgGainPerTrade,
      maxDrawdown: parseFloat(maxDrawdown.toFixed(2)),
      riskReward,
      winCount,
      lossCount,
      totalTrades: trades.length,
      buyHoldGainPct,
      strategyFinalValue: parseFloat(strategyFinalValue.toFixed(2)),
      buyHoldFinalValue: parseFloat(buyHoldFinalValue.toFixed(2)),
    },
  };
}

// ─── SVG Chart ────────────────────────────────────────────────────────────────

function PriceChart({ pricePoints, showComparison }: { pricePoints: PricePoint[]; showComparison: boolean }) {
  const W = 800;
  const H = 220;
  const PAD = { top: 16, right: 20, bottom: 28, left: 56 };

  const prices = pricePoints.map((p) => p.price);
  const minP = Math.min(...prices) * 0.97;
  const maxP = Math.max(...prices) * 1.03;

  const toX = (i: number) => PAD.left + (i / (pricePoints.length - 1)) * (W - PAD.left - PAD.right);
  const toY = (v: number) => PAD.top + ((maxP - v) / (maxP - minP)) * (H - PAD.top - PAD.bottom);

  // Strategy & BH curves (normalized to same scale as price for comparison)
  const stratVals = pricePoints.map((p) => p.strategyValue);
  const bhVals = pricePoints.map((p) => p.buyHoldValue);
  const minC = Math.min(...stratVals, ...bhVals) * 0.97;
  const maxC = Math.max(...stratVals, ...bhVals) * 1.03;
  const toCY = (v: number) => PAD.top + ((maxC - v) / (maxC - minC)) * (H - PAD.top - PAD.bottom);

  // Build path
  const pricePath = pricePoints.map((p, i) => `${i === 0 ? "M" : "L"}${toX(i).toFixed(1)},${toY(p.price).toFixed(1)}`).join(" ");
  const stratPath = pricePoints.map((p, i) => `${i === 0 ? "M" : "L"}${toX(i).toFixed(1)},${toCY(p.strategyValue).toFixed(1)}`).join(" ");
  const bhPath = pricePoints.map((p, i) => `${i === 0 ? "M" : "L"}${toX(i).toFixed(1)},${toCY(p.buyHoldValue).toFixed(1)}`).join(" ");

  // Area fill for price
  const areaPath = `${pricePath} L${toX(pricePoints.length - 1).toFixed(1)},${(H - PAD.bottom).toFixed(1)} L${PAD.left},${(H - PAD.bottom).toFixed(1)} Z`;

  // Y-axis labels
  const yTicks = 4;
  const yLabels = Array.from({ length: yTicks + 1 }, (_, i) => {
    const val = showComparison
      ? minC + ((maxC - minC) * i) / yTicks
      : minP + ((maxP - minP) * i) / yTicks;
    return { val, y: showComparison ? toCY(val) : toY(val) };
  });

  // X-axis labels (every ~30 points)
  const step = Math.max(1, Math.floor(pricePoints.length / 6));
  const xLabels = pricePoints.filter((_, i) => i % step === 0 || i === pricePoints.length - 1);

  // Signals
  const signals = pricePoints.filter((p) => p.signal);

  return (
    <div className="w-full overflow-x-auto">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ minWidth: "340px" }}>
        <defs>
          <linearGradient id="priceGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#6366f1" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#6366f1" stopOpacity="0.02" />
          </linearGradient>
          <linearGradient id="stratGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.02" />
          </linearGradient>
        </defs>

        {/* Grid */}
        {yLabels.map((l, i) => (
          <g key={i}>
            <line x1={PAD.left} y1={l.y} x2={W - PAD.right} y2={l.y} stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
            <text x={PAD.left - 6} y={l.y + 4} textAnchor="end" fontSize="9" fill="rgba(255,255,255,0.3)">
              {showComparison ? `$${l.val.toFixed(0)}` : l.val >= 1000 ? `$${(l.val / 1000).toFixed(1)}k` : `$${l.val.toFixed(2)}`}
            </text>
          </g>
        ))}

        {/* X-axis labels */}
        {xLabels.map((p, i) => {
          const idx = pricePoints.indexOf(p);
          return (
            <text key={i} x={toX(idx)} y={H - 4} textAnchor="middle" fontSize="8" fill="rgba(255,255,255,0.25)">
              {p.date}
            </text>
          );
        })}

        {showComparison ? (
          <>
            {/* Buy & Hold */}
            <path d={bhPath} fill="none" stroke="#22d3ee" strokeWidth="1.5" strokeDasharray="4,3" opacity="0.7" />
            {/* Strategy */}
            <path d={stratPath} fill="none" stroke="#a78bfa" strokeWidth="2" />
            {/* Legend */}
            <g>
              <line x1={PAD.left + 4} y1={PAD.top + 8} x2={PAD.left + 20} y2={PAD.top + 8} stroke="#a78bfa" strokeWidth="2" />
              <text x={PAD.left + 24} y={PAD.top + 12} fontSize="9" fill="#a78bfa">Stratégie IA</text>
              <line x1={PAD.left + 90} y1={PAD.top + 8} x2={PAD.left + 106} y2={PAD.top + 8} stroke="#22d3ee" strokeWidth="1.5" strokeDasharray="4,3" />
              <text x={PAD.left + 110} y={PAD.top + 12} fontSize="9" fill="#22d3ee">Buy &amp; Hold</text>
            </g>
          </>
        ) : (
          <>
            {/* Price area */}
            <path d={areaPath} fill="url(#priceGrad)" />
            {/* Price line */}
            <path d={pricePath} fill="none" stroke="#6366f1" strokeWidth="1.8" />

            {/* Signal zones */}
            {signals.map((p, i) => {
              const idx = pricePoints.indexOf(p);
              return (
                <g key={i}>
                  {/* Arrow marker */}
                  <polygon
                    points={
                      p.signal === "BUY"
                        ? `${toX(idx)},${toY(p.price) - 18} ${toX(idx) - 6},${toY(p.price) - 8} ${toX(idx) + 6},${toY(p.price) - 8}`
                        : `${toX(idx)},${toY(p.price) + 18} ${toX(idx) - 6},${toY(p.price) + 8} ${toX(idx) + 6},${toY(p.price) + 8}`
                    }
                    fill={p.signal === "BUY" ? "#22c55e" : "#ef4444"}
                    opacity="0.9"
                  />
                  {/* Vertical line */}
                  <line
                    x1={toX(idx)} y1={PAD.top} x2={toX(idx)} y2={H - PAD.bottom}
                    stroke={p.signal === "BUY" ? "#22c55e" : "#ef4444"}
                    strokeWidth="1"
                    strokeDasharray="3,3"
                    opacity="0.3"
                  />
                </g>
              );
            })}
          </>
        )}
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

// ─── Dropdown ─────────────────────────────────────────────────────────────────

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
  const [selectedCrypto, setSelectedCrypto] = useState("BTC");
  const [selectedPeriod, setSelectedPeriod] = useState(90);
  const [signalFilter, setSignalFilter] = useState("ALL");
  const [confidenceMin, setConfidenceMin] = useState(50);
  const [isLoading, setIsLoading] = useState(false);
  const [hasRun, setHasRun] = useState(false);
  const [showComparison, setShowComparison] = useState(false);
  const [result, setResult] = useState<ReturnType<typeof generateBacktestData> | null>(null);

  const crypto = CRYPTOS.find((c) => c.symbol === selectedCrypto)!;

  const runBacktest = useCallback(async () => {
    setIsLoading(true);
    await new Promise((r) => setTimeout(r, 1400));
    const data = generateBacktestData(selectedCrypto, selectedPeriod, signalFilter, confidenceMin);
    setResult(data);
    setHasRun(true);
    setIsLoading(false);
  }, [selectedCrypto, selectedPeriod, signalFilter, confidenceMin]);

  const periodLabel = useMemo(() => PERIODS.find((p) => p.days === selectedPeriod)?.label ?? "", [selectedPeriod]);

  return (
    <div className="min-h-screen bg-[#030712] text-white">
      <Sidebar />
      <main className="md:ml-[260px] pt-14 md:pt-0 bg-[#030712]">
        <div className="max-w-[1440px] mx-auto px-6 py-6">
          <PageHeader
            icon={<Activity className="w-6 h-6" />}
            title="Backtesting Visuel des Signaux IA"
            subtitle="Simulez les performances historiques des signaux IA sur n'importe quelle crypto. Visualisez les entrées/sorties, analysez les statistiques et comparez avec une stratégie Buy & Hold."
            accentColor="purple"
            steps={[
              { n: "1", title: "Sélectionnez une crypto et une période", desc: "Choisissez parmi 10 cryptos majeures et une période allant de 1 mois à 2 ans. Appliquez des filtres sur le type de signal et le seuil de confiance." },
              { n: "2", title: "Lancez la simulation des signaux IA passés", desc: "L'IA rejoue tous les signaux générés sur la période choisie et calcule les performances réelles de chaque trade." },
              { n: "3", title: "Analysez les performances et comparez vs Buy & Hold", desc: "Consultez le taux de réussite, le gain total, le drawdown maximum et comparez la stratégie IA face au simple Buy & Hold." },
            ]}
          />

          {/* ── Config Panel ── */}
          <div className="bg-slate-900/50 border border-white/[0.07] rounded-2xl p-5 mb-5">
            <div className="flex items-center gap-2 mb-4">
              <Filter className="w-4 h-4 text-indigo-400" />
              <span className="text-xs font-black text-white uppercase tracking-widest">Configuration du Backtesting</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 items-end">
              <Dropdown
                label="Crypto"
                value={selectedCrypto}
                options={CRYPTOS.map((c) => ({ label: `${c.symbol} — ${c.name}`, value: c.symbol }))}
                onChange={setSelectedCrypto}
              />
              <Dropdown
                label="Période"
                value={selectedPeriod}
                options={PERIODS.map((p) => ({ label: p.label, value: p.days }))}
                onChange={setSelectedPeriod}
              />
              <Dropdown
                label="Type de signal"
                value={signalFilter}
                options={SIGNAL_TYPES}
                onChange={setSignalFilter}
              />
              <Dropdown
                label="Confiance minimum"
                value={confidenceMin}
                options={CONFIDENCE_THRESHOLDS}
                onChange={setConfidenceMin}
              />
              <button
                onClick={runBacktest}
                disabled={isLoading}
                className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:brightness-110 transition-all disabled:opacity-60 disabled:cursor-not-allowed font-black text-sm shadow-lg shadow-indigo-500/20 h-[42px]"
              >
                {isLoading ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Simulation...</>
                ) : (
                  <><Play className="w-4 h-4" /> Lancer le Backtesting</>
                )}
              </button>
            </div>
          </div>

          {/* ── Loading ── */}
          {isLoading && (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <div className="relative w-16 h-16">
                <div className="absolute inset-0 rounded-full border-2 border-indigo-500/20" />
                <div className="absolute inset-0 rounded-full border-2 border-t-indigo-500 animate-spin" />
                <Activity className="absolute inset-0 m-auto w-6 h-6 text-indigo-400" />
              </div>
              <p className="text-sm text-gray-400 font-semibold">Simulation des signaux IA en cours...</p>
              <p className="text-xs text-gray-600">Analyse de {selectedCrypto} sur {periodLabel}</p>
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
                Configurez vos paramètres ci-dessus et cliquez sur <span className="text-indigo-400 font-bold">"Lancer le Backtesting"</span> pour simuler les signaux IA passés.
              </p>
            </div>
          )}

          {/* ── Results ── */}
          {!isLoading && hasRun && result && (
            <div className="space-y-5">
              {/* Stats Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-3">
                <StatCard label="Taux de réussite" value={`${result.stats.winRate}%`} positive={result.stats.winRate >= 50} icon={<Target className="w-3.5 h-3.5" />} />
                <StatCard label="Gain total $" value={`${result.stats.totalGainUSD >= 0 ? "+" : ""}$${result.stats.totalGainUSD.toLocaleString("fr-FR")}`} positive={result.stats.totalGainUSD >= 0} icon={<TrendingUp className="w-3.5 h-3.5" />} />
                <StatCard label="Gain total %" value={`${result.stats.totalGainPct >= 0 ? "+" : ""}${result.stats.totalGainPct}%`} positive={result.stats.totalGainPct >= 0} icon={<BarChart2 className="w-3.5 h-3.5" />} />
                <StatCard label="Gain moyen/trade" value={`${result.stats.avgGainPerTrade >= 0 ? "+" : ""}$${result.stats.avgGainPerTrade}`} positive={result.stats.avgGainPerTrade >= 0} icon={<Activity className="w-3.5 h-3.5" />} />
                <StatCard label="Drawdown max" value={`-${result.stats.maxDrawdown}%`} positive={result.stats.maxDrawdown < 15} icon={<TrendingDown className="w-3.5 h-3.5" />} />
                <StatCard label="Risk/Reward" value={`${result.stats.riskReward}x`} positive={result.stats.riskReward >= 1} icon={<Filter className="w-3.5 h-3.5" />} />
                <StatCard
                  label="Trades W/L"
                  value={`${result.stats.winCount}W / ${result.stats.lossCount}L`}
                  sub={`${result.stats.totalTrades} trades total`}
                  icon={<ArrowUpRight className="w-3.5 h-3.5" />}
                />
              </div>

              {/* Chart */}
              <div className="bg-slate-900/40 border border-white/[0.07] rounded-2xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-xs font-black text-white uppercase tracking-widest">
                      {showComparison ? "Comparaison : Stratégie IA vs Buy & Hold" : `Prix ${selectedCrypto} — Signaux IA`}
                    </p>
                    <p className="text-[10px] text-gray-500 mt-0.5">
                      {crypto.name} • {periodLabel} • Capital initial : $10,000
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
                <PriceChart pricePoints={result.pricePoints} showComparison={showComparison} />

                {/* Legend */}
                {!showComparison && (
                  <div className="flex items-center gap-4 mt-3 pt-3 border-t border-white/[0.05]">
                    <div className="flex items-center gap-1.5">
                      <div className="w-3 h-3 rounded-sm bg-emerald-500/80" />
                      <span className="text-[10px] text-gray-400 font-semibold">Signal BUY (entrée)</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-3 h-3 rounded-sm bg-red-500/80" />
                      <span className="text-[10px] text-gray-400 font-semibold">Signal SELL (sortie)</span>
                    </div>
                    <div className="flex items-center gap-1.5 ml-auto">
                      <span className="text-[10px] text-gray-500">{result.trades.length} signaux affichés</span>
                    </div>
                  </div>
                )}

                {/* Comparison stats */}
                {showComparison && (
                  <div className="grid grid-cols-2 gap-3 mt-4">
                    <div className="p-3 rounded-xl bg-violet-500/10 border border-violet-500/20 text-center">
                      <p className="text-[10px] text-violet-400 font-bold mb-1">🤖 Stratégie IA</p>
                      <p className={`text-lg font-black ${result.stats.totalGainPct >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                        {result.stats.totalGainPct >= 0 ? "+" : ""}{result.stats.totalGainPct}%
                      </p>
                      <p className="text-[10px] text-gray-500">${result.stats.strategyFinalValue.toLocaleString("fr-FR")}</p>
                    </div>
                    <div className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-center">
                      <p className="text-[10px] text-cyan-400 font-bold mb-1">📈 Buy &amp; Hold</p>
                      <p className={`text-lg font-black ${result.stats.buyHoldGainPct >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                        {result.stats.buyHoldGainPct >= 0 ? "+" : ""}{result.stats.buyHoldGainPct}%
                      </p>
                      <p className="text-[10px] text-gray-500">${result.stats.buyHoldFinalValue.toFixed(0)}</p>
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
                        {["#", "Type", "Entrée", "Sortie", "Prix Entrée", "Prix Sortie", "Gain $", "Gain %", "Durée", "Confiance"].map((h) => (
                          <th key={h} className="text-left py-2 px-2 text-[10px] text-gray-500 font-bold uppercase tracking-wider whitespace-nowrap">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {result.trades.map((trade) => (
                        <tr key={trade.id} className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-all">
                          <td className="py-2 px-2 text-gray-500 font-bold">{trade.id}</td>
                          <td className="py-2 px-2">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${trade.type === "BUY" ? "bg-emerald-500/15 text-emerald-400" : "bg-red-500/15 text-red-400"}`}>
                              {trade.type}
                            </span>
                          </td>
                          <td className="py-2 px-2 text-gray-400 whitespace-nowrap">{trade.entryDate}</td>
                          <td className="py-2 px-2 text-gray-400 whitespace-nowrap">{trade.exitDate}</td>
                          <td className="py-2 px-2 text-white font-semibold">${trade.entryPrice.toLocaleString("fr-FR")}</td>
                          <td className="py-2 px-2 text-white font-semibold">${trade.exitPrice.toLocaleString("fr-FR")}</td>
                          <td className={`py-2 px-2 font-black ${trade.profitable ? "text-emerald-400" : "text-red-400"}`}>
                            {trade.gainUSD >= 0 ? "+" : ""}${trade.gainUSD}
                          </td>
                          <td className={`py-2 px-2 font-black ${trade.profitable ? "text-emerald-400" : "text-red-400"}`}>
                            {trade.gainPct >= 0 ? "+" : ""}{trade.gainPct}%
                          </td>
                          <td className="py-2 px-2 text-gray-400">{trade.durationDays}j</td>
                          <td className="py-2 px-2">
                            <div className="flex items-center gap-1.5">
                              <div className="w-12 h-1.5 bg-black/30 rounded-full overflow-hidden">
                                <div
                                  className="h-full rounded-full bg-gradient-to-r from-indigo-600 to-violet-500"
                                  style={{ width: `${trade.confidence}%` }}
                                />
                              </div>
                              <span className="text-[10px] text-gray-400">{trade.confidence}%</span>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {result.trades.length === 0 && (
                        <tr>
                          <td colSpan={10} className="py-8 text-center text-gray-500 text-xs">
                            Aucun trade ne correspond aux filtres sélectionnés. Essayez d'abaisser le seuil de confiance.
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
                  <p className="text-3xl font-black text-emerald-400">{result.stats.winCount}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {result.stats.totalTrades > 0 ? ((result.stats.winCount / result.stats.totalTrades) * 100).toFixed(1) : 0}% du total
                  </p>
                </div>
                <div className="p-4 rounded-2xl bg-red-500/5 border border-red-500/15">
                  <div className="flex items-center gap-2 mb-3">
                    <ArrowDownRight className="w-4 h-4 text-red-400" />
                    <span className="text-xs font-black text-red-400 uppercase tracking-wider">Trades Perdants</span>
                  </div>
                  <p className="text-3xl font-black text-red-400">{result.stats.lossCount}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {result.stats.totalTrades > 0 ? ((result.stats.lossCount / result.stats.totalTrades) * 100).toFixed(1) : 0}% du total
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
        <Footer />
      </main>
    </div>
  );
}