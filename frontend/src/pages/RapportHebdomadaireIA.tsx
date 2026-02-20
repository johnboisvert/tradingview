import { useState, useCallback } from "react";
import Sidebar from "../components/Sidebar";
import PageHeader from "@/components/PageHeader";
import Footer from "@/components/Footer";
import {
  FileText,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Minus,
  BarChart2,
  Brain,
  Star,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  ChevronRight,
  Zap,
  Activity,
  Shield,
  AlertTriangle,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface MarketSummary {
  trend: "bullish" | "bearish" | "neutral";
  btcDominance: number;
  fearGreed: number;
  fearGreedLabel: string;
  totalMarketCap: string;
  weekChange: number;
  description: string;
}

interface Opportunity {
  symbol: string;
  name: string;
  color: string;
  scoreIA: number;
  weekChange: number;
  signal: "BUY" | "SELL" | "HOLD";
  reason: string;
  targetPrice: string;
  currentPrice: string;
}

interface WatchCrypto {
  symbol: string;
  name: string;
  color: string;
  reason: string;
  catalyst: string;
  riskLevel: "Faible" | "Modéré" | "Élevé";
}

interface SignalStats {
  buy: number;
  sell: number;
  hold: number;
  successRate: number;
  bestSignal: string;
  worstSignal: string;
}

interface PortfolioPerf {
  weekReturn: number;
  weekReturnUsd: number;
  totalValue: number;
  bestAsset: string;
  bestAssetReturn: number;
  worstAsset: string;
  worstAssetReturn: number;
}

interface WeekReport {
  weekLabel: string;
  dateRange: string;
  trend: "bullish" | "bearish" | "neutral";
  marketReturn: number;
  topOpportunity: string;
  signalCount: number;
  successRate: number;
  summary: MarketSummary;
  opportunities: Opportunity[];
  watchlist: WatchCrypto[];
  signals: SignalStats;
  portfolio: PortfolioPerf;
}

// ─── Data generators ──────────────────────────────────────────────────────────

function getWeekRange(weeksAgo: number): string {
  const now = new Date();
  const end = new Date(now);
  end.setDate(end.getDate() - weeksAgo * 7);
  const start = new Date(end);
  start.setDate(start.getDate() - 6);
  const fmt = (d: Date) =>
    d.toLocaleDateString("fr-FR", { day: "2-digit", month: "short" });
  return `${fmt(start)} – ${fmt(end)}`;
}

function getWeekLabel(weeksAgo: number): string {
  if (weeksAgo === 0) return "Semaine courante";
  if (weeksAgo === 1) return "Semaine dernière";
  return `Il y a ${weeksAgo} semaines`;
}

function generateReport(weeksAgo: number): WeekReport {
  const seed = weeksAgo * 137 + 42;
  const pr = (s: number, o: number) => ((s * 9301 + o * 49297) % 233280) / 233280;

  const trends: Array<"bullish" | "bearish" | "neutral"> = ["bullish", "bullish", "neutral", "bearish", "bullish", "neutral", "bearish", "bullish"];
  const trend = trends[weeksAgo % trends.length];

  const marketReturn = trend === "bullish"
    ? parseFloat((4 + pr(seed, 1) * 8).toFixed(1))
    : trend === "bearish"
    ? parseFloat((-2 - pr(seed, 2) * 6).toFixed(1))
    : parseFloat((-1 + pr(seed, 3) * 3).toFixed(1));

  const fearGreed = Math.round(
    trend === "bullish" ? 55 + pr(seed, 4) * 30
    : trend === "bearish" ? 15 + pr(seed, 5) * 25
    : 35 + pr(seed, 6) * 20
  );

  const fearGreedLabel =
    fearGreed >= 75 ? "Avidité Extrême"
    : fearGreed >= 55 ? "Avidité"
    : fearGreed >= 45 ? "Neutre"
    : fearGreed >= 25 ? "Peur"
    : "Peur Extrême";

  const btcDom = parseFloat((48 + pr(seed, 7) * 12).toFixed(1));

  const summary: MarketSummary = {
    trend,
    btcDominance: btcDom,
    fearGreed,
    fearGreedLabel,
    totalMarketCap: `$${(2.1 + pr(seed, 8) * 0.8).toFixed(2)}T`,
    weekChange: marketReturn,
    description:
      trend === "bullish"
        ? `Semaine fortement haussière portée par l'adoption institutionnelle et les flux ETF positifs. Le Bitcoin a consolidé sa dominance à ${btcDom}% tandis que les altcoins ont surperformé en fin de semaine.`
        : trend === "bearish"
        ? `Semaine de correction marquée par des prises de bénéfices et une pression vendeuse sur les altcoins. La dominance BTC a augmenté, signe de rotation vers les valeurs refuges crypto.`
        : `Semaine de consolidation avec des mouvements latéraux sur la majorité des actifs. Le marché digère les récents gains dans l'attente de nouveaux catalyseurs macro.`,
  };

  const opps: Opportunity[] = [
    {
      symbol: "SOL", name: "Solana", color: "#9945FF",
      scoreIA: Math.round(72 + pr(seed, 10) * 20),
      weekChange: parseFloat((trend === "bullish" ? 8 + pr(seed, 11) * 15 : -3 - pr(seed, 12) * 8).toFixed(1)),
      signal: trend === "bullish" ? "BUY" : "HOLD",
      reason: "Activité on-chain record, nouveaux projets DeFi déployés, momentum technique fort.",
      targetPrice: "$185", currentPrice: "$162",
    },
    {
      symbol: "ARB", name: "Arbitrum", color: "#28A0F0",
      scoreIA: Math.round(68 + pr(seed, 13) * 18),
      weekChange: parseFloat((trend === "bullish" ? 12 + pr(seed, 14) * 10 : -5 - pr(seed, 15) * 6).toFixed(1)),
      signal: trend === "bullish" ? "BUY" : "SELL",
      reason: "Croissance TVL +18% sur la semaine, lancement de nouveaux protocoles DeFi natifs.",
      targetPrice: "$1.45", currentPrice: "$1.21",
    },
    {
      symbol: "AVAX", name: "Avalanche", color: "#E84142",
      scoreIA: Math.round(65 + pr(seed, 16) * 20),
      weekChange: parseFloat((trend === "bullish" ? 6 + pr(seed, 17) * 12 : -4 - pr(seed, 18) * 7).toFixed(1)),
      signal: "HOLD",
      reason: "Partenariats institutionnels annoncés, subnet gaming en forte croissance.",
      targetPrice: "$42", currentPrice: "$38",
    },
    {
      symbol: "LINK", name: "Chainlink", color: "#375BD2",
      scoreIA: Math.round(70 + pr(seed, 19) * 15),
      weekChange: parseFloat((trend === "bullish" ? 5 + pr(seed, 20) * 8 : -2 - pr(seed, 21) * 5).toFixed(1)),
      signal: trend === "bullish" ? "BUY" : "HOLD",
      reason: "Expansion CCIP vers 3 nouvelles blockchains, intégration TradFi confirmée.",
      targetPrice: "$18", currentPrice: "$15.8",
    },
    {
      symbol: "OP", name: "Optimism", color: "#FF0420",
      scoreIA: Math.round(62 + pr(seed, 22) * 22),
      weekChange: parseFloat((trend === "bullish" ? 9 + pr(seed, 23) * 14 : -6 - pr(seed, 24) * 9).toFixed(1)),
      signal: trend === "bullish" ? "BUY" : "SELL",
      reason: "Superchain adoption accélérée, Base (Coinbase) génère des revenus partagés record.",
      targetPrice: "$2.80", currentPrice: "$2.35",
    },
  ].sort((a, b) => b.scoreIA - a.scoreIA);

  const watchlist: WatchCrypto[] = [
    {
      symbol: "INJ", name: "Injective", color: "#00C2FF",
      reason: "Breakout technique imminent sur le niveau de résistance clé à $32. Volume en hausse de 45%.",
      catalyst: "Lancement de nouveaux marchés dérivés on-chain la semaine prochaine.",
      riskLevel: "Modéré",
    },
    {
      symbol: "TIA", name: "Celestia", color: "#7B2FBE",
      reason: "Accumulation whale détectée, +12% de wallets actifs en 7 jours.",
      catalyst: "Intégration avec 5 nouveaux rollups annoncée pour la semaine prochaine.",
      riskLevel: "Élevé",
    },
    {
      symbol: "NEAR", name: "NEAR Protocol", color: "#00C08B",
      reason: "Pattern de retournement haussier sur le graphique hebdomadaire, RSI en zone de survente.",
      catalyst: "Partenariat IA avec une grande entreprise tech attendu.",
      riskLevel: "Modéré",
    },
    {
      symbol: "STX", name: "Stacks", color: "#5546FF",
      reason: "Activation du protocole Nakamoto imminente, catalyseur majeur pour l'écosystème Bitcoin DeFi.",
      catalyst: "Mise à jour Nakamoto = smart contracts natifs sur Bitcoin.",
      riskLevel: "Élevé",
    },
  ];

  const buyCount = Math.round(18 + pr(seed, 25) * 15);
  const sellCount = Math.round(8 + pr(seed, 26) * 10);
  const holdCount = Math.round(12 + pr(seed, 27) * 8);

  const signals: SignalStats = {
    buy: buyCount,
    sell: sellCount,
    hold: holdCount,
    successRate: Math.round(62 + pr(seed, 28) * 20),
    bestSignal: "SOL BUY +14.2%",
    worstSignal: "DOGE SELL -8.1%",
  };

  const portfolioReturn = parseFloat((marketReturn * (0.8 + pr(seed, 29) * 0.6)).toFixed(1));
  const portfolioValue = Math.round(12500 + pr(seed, 30) * 8000);

  const portfolio: PortfolioPerf = {
    weekReturn: portfolioReturn,
    weekReturnUsd: Math.round(portfolioValue * portfolioReturn / 100),
    totalValue: portfolioValue,
    bestAsset: "SOL",
    bestAssetReturn: parseFloat((10 + pr(seed, 31) * 12).toFixed(1)),
    worstAsset: "DOGE",
    worstAssetReturn: parseFloat((-3 - pr(seed, 32) * 7).toFixed(1)),
  };

  return {
    weekLabel: getWeekLabel(weeksAgo),
    dateRange: getWeekRange(weeksAgo),
    trend,
    marketReturn,
    topOpportunity: opps[0].symbol,
    signalCount: buyCount + sellCount + holdCount,
    successRate: signals.successRate,
    summary,
    opportunities: opps,
    watchlist,
    signals,
    portfolio,
  };
}

// Pre-generate 8 weeks of reports
const ALL_REPORTS: WeekReport[] = Array.from({ length: 8 }, (_, i) => generateReport(i));

// ─── Visual helpers ───────────────────────────────────────────────────────────

function TrendBadge({ trend }: { trend: "bullish" | "bearish" | "neutral" }) {
  const cfg = {
    bullish: { label: "Haussier", cls: "bg-emerald-500/15 text-emerald-400 border-emerald-500/25", icon: <TrendingUp className="w-3 h-3" /> },
    bearish: { label: "Baissier", cls: "bg-red-500/15 text-red-400 border-red-500/25", icon: <TrendingDown className="w-3 h-3" /> },
    neutral: { label: "Neutre", cls: "bg-amber-500/15 text-amber-400 border-amber-500/25", icon: <Minus className="w-3 h-3" /> },
  }[trend];
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-xs font-bold ${cfg.cls}`}>
      {cfg.icon}{cfg.label}
    </span>
  );
}

function SignalBadge({ signal }: { signal: "BUY" | "SELL" | "HOLD" }) {
  const cfg = {
    BUY: "bg-emerald-500/15 text-emerald-400 border-emerald-500/25",
    SELL: "bg-red-500/15 text-red-400 border-red-500/25",
    HOLD: "bg-amber-500/15 text-amber-400 border-amber-500/25",
  }[signal];
  return <span className={`px-2 py-0.5 rounded-full border text-[10px] font-black ${cfg}`}>{signal}</span>;
}

function FearGreedMeter({ value, label }: { value: number; label: string }) {
  const color = value >= 75 ? "#10b981" : value >= 55 ? "#84cc16" : value >= 45 ? "#f59e0b" : value >= 25 ? "#f97316" : "#ef4444";
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative w-16 h-16">
        <svg width={64} height={64} viewBox="0 0 64 64" className="-rotate-90">
          <circle cx={32} cy={32} r={26} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={8} />
          <circle
            cx={32} cy={32} r={26}
            fill="none" stroke={color} strokeWidth={8}
            strokeLinecap="round"
            strokeDasharray={`${(value / 100) * 163.4} 163.4`}
            className="transition-all duration-700"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-sm font-black" style={{ color }}>{value}</span>
        </div>
      </div>
      <span className="text-[10px] text-gray-500 font-semibold text-center leading-tight">{label}</span>
    </div>
  );
}

// ─── Report sections ──────────────────────────────────────────────────────────

function MarketSummarySection({ data }: { data: MarketSummary }) {
  return (
    <div className="bg-slate-900/60 border border-white/[0.07] rounded-2xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <Activity className="w-4 h-4 text-indigo-400" />
        <h3 className="text-sm font-black text-white">Résumé du Marché Global</h3>
        <TrendBadge trend={data.trend} />
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
        <div className="p-3 rounded-xl bg-black/20 border border-white/[0.05] text-center">
          <p className="text-[10px] text-gray-500 mb-1">Capitalisation</p>
          <p className="text-sm font-black text-white">{data.totalMarketCap}</p>
          <p className={`text-[10px] font-bold ${data.weekChange >= 0 ? "text-emerald-400" : "text-red-400"}`}>
            {data.weekChange >= 0 ? "+" : ""}{data.weekChange}% cette semaine
          </p>
        </div>
        <div className="p-3 rounded-xl bg-black/20 border border-white/[0.05] text-center">
          <p className="text-[10px] text-gray-500 mb-1">Dominance BTC</p>
          <p className="text-sm font-black text-amber-400">{data.btcDominance}%</p>
          <div className="w-full h-1 bg-white/[0.05] rounded-full mt-1 overflow-hidden">
            <div className="h-full bg-amber-400 rounded-full" style={{ width: `${data.btcDominance}%`, opacity: 0.8 }} />
          </div>
        </div>
        <div className="col-span-2 flex items-center justify-center gap-4 p-3 rounded-xl bg-black/20 border border-white/[0.05]">
          <FearGreedMeter value={data.fearGreed} label={data.fearGreedLabel} />
          <div>
            <p className="text-[10px] text-gray-500 mb-0.5">Fear & Greed Index</p>
            <p className="text-base font-black text-white">{data.fearGreed}<span className="text-xs text-gray-500">/100</span></p>
            <p className="text-xs font-bold text-gray-400">{data.fearGreedLabel}</p>
          </div>
        </div>
      </div>
      <p className="text-xs text-gray-400 leading-relaxed bg-black/20 rounded-xl p-3 border border-white/[0.04]">
        💬 {data.description}
      </p>
    </div>
  );
}

function OpportunitiesSection({ opps }: { opps: Opportunity[] }) {
  return (
    <div className="bg-slate-900/60 border border-white/[0.07] rounded-2xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <Star className="w-4 h-4 text-amber-400" />
        <h3 className="text-sm font-black text-white">Top 5 Opportunités de la Semaine</h3>
      </div>
      <div className="space-y-2">
        {opps.map((opp, idx) => (
          <div key={opp.symbol} className="flex items-center gap-3 p-3 rounded-xl bg-black/20 border border-white/[0.04] hover:bg-white/[0.03] transition-all">
            <span className="text-xs font-black text-gray-600 w-4">#{idx + 1}</span>
            <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: opp.color }} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-black text-white">{opp.symbol}</span>
                <span className="text-[10px] text-gray-500">{opp.name}</span>
                <SignalBadge signal={opp.signal} />
              </div>
              <p className="text-[10px] text-gray-500 truncate mt-0.5">{opp.reason}</p>
            </div>
            <div className="text-right flex-shrink-0">
              <p className={`text-sm font-black ${opp.weekChange >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                {opp.weekChange >= 0 ? "+" : ""}{opp.weekChange}%
              </p>
              <p className="text-[10px] text-gray-500">Score IA: <span className="text-indigo-400 font-bold">{opp.scoreIA}</span></p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function WatchlistSection({ watchlist }: { watchlist: WatchCrypto[] }) {
  const riskColor = (r: string) =>
    r === "Faible" ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20"
    : r === "Modéré" ? "text-amber-400 bg-amber-500/10 border-amber-500/20"
    : "text-red-400 bg-red-500/10 border-red-500/20";

  return (
    <div className="bg-slate-900/60 border border-white/[0.07] rounded-2xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <Eye className="w-4 h-4 text-violet-400" />
        <h3 className="text-sm font-black text-white">Cryptos à Surveiller la Semaine Prochaine</h3>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {watchlist.map((w) => (
          <div key={w.symbol} className="p-3 rounded-xl bg-black/20 border border-white/[0.04]">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: w.color }} />
                <span className="text-sm font-black text-white">{w.symbol}</span>
                <span className="text-[10px] text-gray-500">{w.name}</span>
              </div>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${riskColor(w.riskLevel)}`}>
                {w.riskLevel}
              </span>
            </div>
            <p className="text-[11px] text-gray-400 leading-relaxed mb-1.5">{w.reason}</p>
            <div className="flex items-start gap-1.5">
              <Zap className="w-3 h-3 text-indigo-400 flex-shrink-0 mt-0.5" />
              <p className="text-[10px] text-indigo-300 leading-relaxed">{w.catalyst}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SignalsSection({ signals }: { signals: SignalStats }) {
  const total = signals.buy + signals.sell + signals.hold;
  return (
    <div className="bg-slate-900/60 border border-white/[0.07] rounded-2xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <Brain className="w-4 h-4 text-indigo-400" />
        <h3 className="text-sm font-black text-white">Résumé des Signaux IA de la Semaine</h3>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-center">
          <p className="text-[10px] text-emerald-400 font-bold mb-1">Signaux BUY</p>
          <p className="text-2xl font-black text-emerald-400">{signals.buy}</p>
        </div>
        <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-center">
          <p className="text-[10px] text-red-400 font-bold mb-1">Signaux SELL</p>
          <p className="text-2xl font-black text-red-400">{signals.sell}</p>
        </div>
        <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-center">
          <p className="text-[10px] text-amber-400 font-bold mb-1">Signaux HOLD</p>
          <p className="text-2xl font-black text-amber-400">{signals.hold}</p>
        </div>
        <div className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-center">
          <p className="text-[10px] text-indigo-400 font-bold mb-1">Taux de réussite</p>
          <p className="text-2xl font-black text-indigo-400">{signals.successRate}%</p>
        </div>
      </div>
      {/* Distribution bar */}
      <div className="mb-3">
        <p className="text-[10px] text-gray-500 mb-1.5">Distribution des signaux ({total} au total)</p>
        <div className="flex h-2 rounded-full overflow-hidden gap-0.5">
          <div className="bg-emerald-500 rounded-l-full transition-all duration-700" style={{ width: `${(signals.buy / total) * 100}%`, opacity: 0.85 }} />
          <div className="bg-amber-500 transition-all duration-700" style={{ width: `${(signals.hold / total) * 100}%`, opacity: 0.85 }} />
          <div className="bg-red-500 rounded-r-full transition-all duration-700" style={{ width: `${(signals.sell / total) * 100}%`, opacity: 0.85 }} />
        </div>
        <div className="flex justify-between mt-1">
          <span className="text-[9px] text-emerald-400">{Math.round((signals.buy / total) * 100)}% BUY</span>
          <span className="text-[9px] text-amber-400">{Math.round((signals.hold / total) * 100)}% HOLD</span>
          <span className="text-[9px] text-red-400">{Math.round((signals.sell / total) * 100)}% SELL</span>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="flex items-center gap-2 p-2.5 rounded-xl bg-black/20 border border-white/[0.04]">
          <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <div>
            <p className="text-[10px] text-gray-500">Meilleur signal</p>
            <p className="text-xs font-black text-emerald-400">{signals.bestSignal}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 p-2.5 rounded-xl bg-black/20 border border-white/[0.04]">
          <XCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
          <div>
            <p className="text-[10px] text-gray-500">Signal raté</p>
            <p className="text-xs font-black text-red-400">{signals.worstSignal}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function PortfolioSection({ perf }: { perf: PortfolioPerf }) {
  const positive = perf.weekReturn >= 0;
  return (
    <div className="bg-slate-900/60 border border-white/[0.07] rounded-2xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <BarChart2 className="w-4 h-4 text-violet-400" />
        <h3 className="text-sm font-black text-white">Performance Portfolio Utilisateur</h3>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3 rounded-xl bg-black/20 border border-white/[0.05] text-center">
          <p className="text-[10px] text-gray-500 mb-1">Valeur totale</p>
          <p className="text-base font-black text-white">${perf.totalValue.toLocaleString()}</p>
        </div>
        <div className={`p-3 rounded-xl border text-center ${positive ? "bg-emerald-500/10 border-emerald-500/20" : "bg-red-500/10 border-red-500/20"}`}>
          <p className="text-[10px] text-gray-500 mb-1">Retour semaine</p>
          <p className={`text-base font-black ${positive ? "text-emerald-400" : "text-red-400"}`}>
            {positive ? "+" : ""}{perf.weekReturn}%
          </p>
          <p className={`text-[10px] font-bold ${positive ? "text-emerald-400" : "text-red-400"}`}>
            {positive ? "+" : ""}{perf.weekReturnUsd >= 0 ? "+" : ""}${Math.abs(perf.weekReturnUsd).toLocaleString()}
          </p>
        </div>
        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-center">
          <p className="text-[10px] text-gray-500 mb-1">Meilleur actif</p>
          <p className="text-base font-black text-emerald-400">{perf.bestAsset}</p>
          <p className="text-[10px] font-bold text-emerald-400">+{perf.bestAssetReturn}%</p>
        </div>
        <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-center">
          <p className="text-[10px] text-gray-500 mb-1">Actif en retard</p>
          <p className="text-base font-black text-red-400">{perf.worstAsset}</p>
          <p className="text-[10px] font-bold text-red-400">{perf.worstAssetReturn}%</p>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function RapportHebdomadaireIA() {
  const [selectedWeek, setSelectedWeek] = useState(0);
  const [generating, setGenerating] = useState(false);
  const [report, setReport] = useState<WeekReport>(ALL_REPORTS[0]);

  const handleGenerate = useCallback(() => {
    setGenerating(true);
    setTimeout(() => {
      setReport(generateReport(selectedWeek));
      setGenerating(false);
    }, 1800);
  }, [selectedWeek]);

  const handleSelectWeek = (idx: number) => {
    setSelectedWeek(idx);
    setReport(ALL_REPORTS[idx]);
  };

  const trendIcon = report.trend === "bullish"
    ? <TrendingUp className="w-4 h-4 text-emerald-400" />
    : report.trend === "bearish"
    ? <TrendingDown className="w-4 h-4 text-red-400" />
    : <Minus className="w-4 h-4 text-amber-400" />;

  return (
    <div className="flex min-h-screen bg-[#030712]">
      <Sidebar />
      <main className="flex-1 ml-[260px] bg-[#030712]">
        <div className="relative z-10 max-w-[1440px] mx-auto px-6 py-6">
          {/* Page Header */}
          <PageHeader
            icon={<FileText className="w-6 h-6" />}
            title="Rapport Hebdomadaire IA"
            subtitle="Chaque semaine, l'IA analyse l'ensemble du marché crypto et génère un rapport complet : résumé de marché, top opportunités, cryptos à surveiller, performance des signaux et de votre portfolio."
            accentColor="indigo"
            steps={[
              { n: "1", title: "Consultez le rapport de la semaine", desc: "Le rapport couvre le résumé du marché global (tendance, Fear & Greed, dominance BTC), les top 5 opportunités identifiées par l'IA et la performance des signaux." },
              { n: "2", title: "Analysez les opportunités identifiées", desc: "Chaque opportunité est accompagnée d'un score IA, d'un signal (BUY/SELL/HOLD), d'une variation hebdomadaire et d'une explication détaillée des raisons." },
              { n: "3", title: "Planifiez vos trades", desc: "Utilisez la section 'Cryptos à surveiller' pour anticiper les mouvements de la semaine prochaine. Combinez avec le Simulateur de Stratégie IA pour une approche complète." },
            ]}
          />

          <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">
            {/* ── Left: History + Generate ── */}
            <div className="space-y-4">
              {/* Generate button */}
              <button
                onClick={handleGenerate}
                disabled={generating}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-black text-sm transition-all flex items-center justify-center gap-2 disabled:opacity-60 shadow-lg shadow-indigo-500/20"
              >
                {generating ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Génération IA en cours...
                  </>
                ) : (
                  <>
                    <Brain className="w-4 h-4" />
                    Générer le rapport maintenant
                  </>
                )}
              </button>

              {/* History */}
              <div className="bg-slate-900/60 border border-white/[0.07] rounded-2xl p-4">
                <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5" /> Historique des rapports
                </h3>
                <div className="space-y-1.5">
                  {ALL_REPORTS.map((r, idx) => {
                    const trendCfg = {
                      bullish: { color: "text-emerald-400", dot: "bg-emerald-400" },
                      bearish: { color: "text-red-400", dot: "bg-red-400" },
                      neutral: { color: "text-amber-400", dot: "bg-amber-400" },
                    }[r.trend];
                    const isActive = idx === selectedWeek;
                    return (
                      <button
                        key={idx}
                        onClick={() => handleSelectWeek(idx)}
                        className={`w-full flex items-center gap-3 p-2.5 rounded-xl transition-all text-left ${isActive ? "bg-indigo-500/15 border border-indigo-500/25" : "hover:bg-white/[0.03] border border-transparent"}`}
                      >
                        <div className={`w-2 h-2 rounded-full flex-shrink-0 ${trendCfg.dot}`} />
                        <div className="flex-1 min-w-0">
                          <p className={`text-xs font-bold truncate ${isActive ? "text-white" : "text-gray-400"}`}>{r.weekLabel}</p>
                          <p className="text-[10px] text-gray-600 truncate">{r.dateRange}</p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className={`text-[10px] font-black ${trendCfg.color}`}>
                            {r.marketReturn >= 0 ? "+" : ""}{r.marketReturn}%
                          </p>
                          <p className="text-[9px] text-gray-600">{r.signalCount} signaux</p>
                        </div>
                        {isActive && <ChevronRight className="w-3 h-3 text-indigo-400 flex-shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Quick stats */}
              <div className="bg-slate-900/60 border border-white/[0.07] rounded-2xl p-4">
                <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                  <Shield className="w-3.5 h-3.5" /> Stats du rapport sélectionné
                </h3>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-500">Tendance</span>
                    <TrendBadge trend={report.trend} />
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-500">Perf. marché</span>
                    <span className={`text-xs font-black ${report.marketReturn >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                      {report.marketReturn >= 0 ? "+" : ""}{report.marketReturn}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-500">Top opportunité</span>
                    <span className="text-xs font-black text-white">{report.topOpportunity}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-500">Signaux générés</span>
                    <span className="text-xs font-black text-indigo-400">{report.signalCount}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-500">Taux de réussite</span>
                    <span className="text-xs font-black text-emerald-400">{report.successRate}%</span>
                  </div>
                </div>
              </div>
            </div>

            {/* ── Right: Report content ── */}
            <div className="space-y-5">
              {/* Report header */}
              <div className="bg-gradient-to-r from-indigo-900/30 to-violet-900/20 border border-indigo-500/20 rounded-2xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {trendIcon}
                  <div>
                    <h2 className="text-base font-black text-white">{report.weekLabel}</h2>
                    <p className="text-xs text-gray-400">{report.dateRange}</p>
                  </div>
                </div>
                {generating ? (
                  <div className="flex items-center gap-2 text-indigo-400">
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span className="text-xs font-bold">Analyse IA en cours...</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-emerald-400">
                    <CheckCircle className="w-4 h-4" />
                    <span className="text-xs font-bold">Rapport généré</span>
                  </div>
                )}
              </div>

              {generating ? (
                <div className="flex flex-col items-center justify-center h-64 bg-slate-900/40 border border-white/[0.05] rounded-2xl gap-4">
                  <div className="w-12 h-12 border-2 border-indigo-500/20 border-t-indigo-400 rounded-full animate-spin" />
                  <div className="text-center">
                    <p className="text-sm font-bold text-white">L'IA analyse le marché...</p>
                    <p className="text-xs text-gray-500 mt-1">Collecte des données · Analyse technique · Scoring · Rédaction</p>
                  </div>
                </div>
              ) : (
                <>
                  <MarketSummarySection data={report.summary} />
                  <OpportunitiesSection opps={report.opportunities} />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <SignalsSection signals={report.signals} />
                    <PortfolioSection perf={report.portfolio} />
                  </div>
                  <WatchlistSection watchlist={report.watchlist} />

                  {/* Disclaimer */}
                  <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-500/5 border border-amber-500/15">
                    <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                    <p className="text-[11px] text-gray-500 leading-relaxed">
                      Ce rapport est généré automatiquement par l'IA à titre informatif uniquement. Il ne constitue pas un conseil financier. Les performances passées ne garantissent pas les résultats futurs. Investissez uniquement ce que vous êtes prêt à perdre.
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
        <Footer />
      </main>
    </div>
  );
}