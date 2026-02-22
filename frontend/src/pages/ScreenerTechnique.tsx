import { useState, useEffect, useCallback } from "react";
import Sidebar from "@/components/Sidebar";
import PageHeader from "@/components/PageHeader";
import {
  Search, SlidersHorizontal, TrendingUp, TrendingDown, Zap,
  RefreshCw, ChevronUp, ChevronDown, Target, Activity,
  BarChart3, AlertTriangle, CheckCircle, XCircle, Filter
} from "lucide-react";

import Footer from "@/components/Footer";

interface CoinScreener {
  id: string;
  symbol: string;
  name: string;
  image: string;
  current_price: number;
  price_change_percentage_24h: number;
  price_change_percentage_7d_in_currency?: number;
  market_cap: number;
  total_volume: number;
  high_24h: number;
  low_24h: number;
  ath: number;
  ath_change_percentage: number;
  sparkline_in_7d?: { price: number[] };
  // Computed
  rsi?: number;
  trend?: "bullish" | "bearish" | "neutral";
  signal?: "BUY" | "SELL" | "NEUTRAL";
  score?: number;
  volumeRatio?: number;
  volatility?: number;
  distFromATH?: number;
}

interface Filters {
  rsiMin: number;
  rsiMax: number;
  change24hMin: number;
  change24hMax: number;
  volumeRatioMin: number;
  trend: "all" | "bullish" | "bearish" | "neutral";
  signal: "all" | "BUY" | "SELL" | "NEUTRAL";
  minMarketCap: number;
  scoreMin: number;
}

const DEFAULT_FILTERS: Filters = {
  rsiMin: 0, rsiMax: 100,
  change24hMin: -100, change24hMax: 100,
  volumeRatioMin: 0,
  trend: "all", signal: "all",
  minMarketCap: 0, scoreMin: 0,
};

function computeRSI(prices: number[]): number {
  if (!prices || prices.length < 15) return 50;
  const changes = prices.slice(-15).map((p, i, arr) => i === 0 ? 0 : p - arr[i - 1]).slice(1);
  const gains = changes.filter(c => c > 0);
  const losses = changes.filter(c => c < 0).map(Math.abs);
  const avgGain = gains.length > 0 ? gains.reduce((a, b) => a + b, 0) / 14 : 0;
  const avgLoss = losses.length > 0 ? losses.reduce((a, b) => a + b, 0) / 14 : 0.001;
  const rs = avgGain / avgLoss;
  return Math.round(100 - 100 / (1 + rs));
}

function computeSignal(rsi: number, change24h: number, volumeRatio: number, change7d: number): { signal: "BUY" | "SELL" | "NEUTRAL"; score: number; trend: "bullish" | "bearish" | "neutral" } {
  let score = 50;
  if (rsi < 30) score += 20;
  else if (rsi < 40) score += 10;
  else if (rsi > 70) score -= 20;
  else if (rsi > 60) score -= 10;
  if (change24h > 3) score += 10;
  else if (change24h > 0) score += 5;
  else if (change24h < -3) score -= 10;
  else if (change24h < 0) score -= 5;
  if (volumeRatio > 2) score += 15;
  else if (volumeRatio > 1.5) score += 8;
  if (change7d > 10) score += 10;
  else if (change7d > 0) score += 5;
  else if (change7d < -10) score -= 10;
  else if (change7d < 0) score -= 5;
  score = Math.max(0, Math.min(100, score));
  const signal: "BUY" | "SELL" | "NEUTRAL" = score >= 65 ? "BUY" : score <= 35 ? "SELL" : "NEUTRAL";
  const trend: "bullish" | "bearish" | "neutral" = change24h > 1 && change7d > 0 ? "bullish" : change24h < -1 && change7d < 0 ? "bearish" : "neutral";
  return { signal, score, trend };
}

function formatPrice(p: number): string {
  if (p >= 1000) return `$${p.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
  if (p >= 1) return `$${p.toFixed(2)}`;
  return `$${p.toFixed(4)}`;
}

function formatNum(n: number): string {
  if (n >= 1e9) return `$${(n / 1e9).toFixed(1)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(0)}M`;
  return `$${n.toFixed(0)}`;
}

function RSIBar({ value }: { value: number }) {
  const color = value < 30 ? "#10B981" : value > 70 ? "#EF4444" : value < 45 ? "#6EE7B7" : value > 55 ? "#FCA5A5" : "#94A3B8";
  return (
    <div className="flex items-center gap-2">
      <div className="w-16 h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{ width: `${value}%`, backgroundColor: color }} />
      </div>
      <span className="text-xs font-bold" style={{ color }}>{value}</span>
    </div>
  );
}

function ScoreRing({ score }: { score: number }) {
  const color = score >= 65 ? "#10B981" : score <= 35 ? "#EF4444" : "#94A3B8";
  const r = 14;
  const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;
  return (
    <div className="relative w-10 h-10 flex items-center justify-center">
      <svg width="40" height="40" className="-rotate-90">
        <circle cx="20" cy="20" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="3" />
        <circle cx="20" cy="20" r={r} fill="none" stroke={color} strokeWidth="3" strokeDasharray={`${dash} ${circ}`} strokeLinecap="round" />
      </svg>
      <span className="absolute text-[10px] font-extrabold" style={{ color }}>{score}</span>
    </div>
  );
}

export default function ScreenerTechnique() {
  const [coins, setCoins] = useState<CoinScreener[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState("");
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [showFilters, setShowFilters] = useState(true);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<keyof CoinScreener>("score");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);
  const PER_PAGE = 25;

  const fetchCoins = useCallback(async () => {
    setLoading(true);
    try {
      const pages = await Promise.all([1, 2, 3, 4].map(p =>
        fetch(`/api/coingecko/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=50&page=${p}&sparkline=true&price_change_percentage=7d`, { signal: AbortSignal.timeout(15000) })
          .then(r => r.ok ? r.json() : [])
          .catch(() => [])
      ));
      const raw: CoinScreener[] = pages.flat();
      if (raw.length === 0) throw new Error("No data");

      const processed = raw.map(c => {
        const prices = c.sparkline_in_7d?.price || [];
        const rsi = computeRSI(prices);
        const avgVol = c.market_cap > 0 ? c.total_volume / c.market_cap * 100 : 1;
        const volumeRatio = avgVol > 0 ? (c.total_volume / c.market_cap) / (avgVol / 100) : 1;
        const change7d = c.price_change_percentage_7d_in_currency || 0;
        const { signal, score, trend } = computeSignal(rsi, c.price_change_percentage_24h, volumeRatio, change7d);
        const volatility = c.high_24h > 0 ? ((c.high_24h - c.low_24h) / c.low_24h) * 100 : 0;
        const distFromATH = c.ath_change_percentage || 0;
        return { ...c, rsi, signal, score, trend, volumeRatio: Math.round(volumeRatio * 10) / 10, volatility: Math.round(volatility * 10) / 10, distFromATH: Math.round(distFromATH * 10) / 10 };
      });

      setCoins(processed);
      setLastUpdate(new Date().toLocaleTimeString("fr-FR"));
    } catch {
      // keep empty
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchCoins(); const i = setInterval(fetchCoins, 120000); return () => clearInterval(i); }, [fetchCoins]);

  const filtered = coins.filter(c => {
    if (search && !c.name.toLowerCase().includes(search.toLowerCase()) && !c.symbol.toLowerCase().includes(search.toLowerCase())) return false;
    if ((c.rsi ?? 50) < filters.rsiMin || (c.rsi ?? 50) > filters.rsiMax) return false;
    if (c.price_change_percentage_24h < filters.change24hMin || c.price_change_percentage_24h > filters.change24hMax) return false;
    if ((c.volumeRatio ?? 1) < filters.volumeRatioMin) return false;
    if (filters.trend !== "all" && c.trend !== filters.trend) return false;
    if (filters.signal !== "all" && c.signal !== filters.signal) return false;
    if (c.market_cap < filters.minMarketCap * 1e6) return false;
    if ((c.score ?? 50) < filters.scoreMin) return false;
    return true;
  });

  const sorted = [...filtered].sort((a, b) => {
    const va = (a[sortBy] as number) ?? 0;
    const vb = (b[sortBy] as number) ?? 0;
    return sortDir === "desc" ? vb - va : va - vb;
  });

  const paginated = sorted.slice((page - 1) * PER_PAGE, page * PER_PAGE);
  const totalPages = Math.ceil(sorted.length / PER_PAGE);

  const toggleSort = (key: keyof CoinScreener) => {
    if (sortBy === key) setSortDir(d => d === "desc" ? "asc" : "desc");
    else { setSortBy(key); setSortDir("desc"); }
  };

  const SortIcon = ({ col }: { col: keyof CoinScreener }) => sortBy === col
    ? (sortDir === "desc" ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />)
    : <ChevronDown className="w-3 h-3 opacity-20" />;

  const buyCount = coins.filter(c => c.signal === "BUY").length;
  const sellCount = coins.filter(c => c.signal === "SELL").length;

  return (
    <div className="min-h-screen bg-[#070B14] text-white">
      <Sidebar />
      <main className="md:ml-[260px] pt-14 md:pt-0 bg-[#070B14]">
      <PageHeader
          icon={<Target className="w-6 h-6" />}
          title="Screener Technique"
          subtitle="Filtrez et triez des centaines de cryptos selon des critères techniques précis : RSI, MACD, Bollinger Bands, volume et tendance. Trouvez les setups les plus prometteurs."
          accentColor="cyan"
          steps={[
            { n: "1", title: "Appliquez vos filtres", desc: "Sélectionnez les indicateurs techniques qui vous intéressent (RSI survendu < 30, MACD haussier, etc.) pour filtrer les cryptos." },
            { n: "2", title: "Triez les résultats", desc: "Cliquez sur les en-têtes de colonnes pour trier par score technique, variation, volume ou market cap." },
            { n: "3", title: "Analysez les setups", desc: "Chaque crypto affiche un score technique global. Cliquez sur une ligne pour voir l'analyse détaillée des indicateurs." },
          ]}
        />
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
                <SlidersHorizontal className="w-5 h-5 text-white" />
              </div>
              <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-indigo-400 bg-clip-text text-transparent">
                Screener Technique
              </span>
            </h1>
            <p className="text-sm text-gray-500 mt-1">Filtrez les {coins.length} cryptos par indicateurs techniques</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-xs font-bold text-emerald-400">{buyCount} BUY</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-red-500/10 border border-red-500/20">
              <XCircle className="w-3.5 h-3.5 text-red-400" />
              <span className="text-xs font-bold text-red-400">{sellCount} SELL</span>
            </div>
            <button onClick={fetchCoins} disabled={loading}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.10] border border-white/[0.08] text-sm font-semibold transition-all">
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
              {lastUpdate ? `MAJ ${lastUpdate}` : "Charger"}
            </button>
          </div>
        </div>

        {/* Filters Panel */}
        <div className="bg-[#0d1117] border border-white/[0.06] rounded-2xl mb-5 overflow-hidden">
          <button onClick={() => setShowFilters(!showFilters)}
            className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-white/[0.02] transition-all">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-cyan-400" />
              <span className="text-sm font-bold">Filtres Techniques</span>
              <span className="text-xs text-gray-600">({filtered.length} résultats)</span>
            </div>
            {showFilters ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
          </button>
          {showFilters && (
            <div className="px-5 pb-5 border-t border-white/[0.04]">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase mb-2 block">RSI Min — Max</label>
                  <div className="flex gap-2">
                    <input type="number" min={0} max={100} value={filters.rsiMin} onChange={e => setFilters(f => ({ ...f, rsiMin: +e.target.value }))}
                      className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-500/40" />
                    <input type="number" min={0} max={100} value={filters.rsiMax} onChange={e => setFilters(f => ({ ...f, rsiMax: +e.target.value }))}
                      className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-500/40" />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase mb-2 block">Variation 24h (%)</label>
                  <div className="flex gap-2">
                    <input type="number" value={filters.change24hMin} onChange={e => setFilters(f => ({ ...f, change24hMin: +e.target.value }))}
                      className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-500/40" />
                    <input type="number" value={filters.change24hMax} onChange={e => setFilters(f => ({ ...f, change24hMax: +e.target.value }))}
                      className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-500/40" />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase mb-2 block">Ratio Volume Min</label>
                  <input type="number" step={0.1} min={0} value={filters.volumeRatioMin} onChange={e => setFilters(f => ({ ...f, volumeRatioMin: +e.target.value }))}
                    className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-500/40" />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase mb-2 block">Score IA Min</label>
                  <input type="number" min={0} max={100} value={filters.scoreMin} onChange={e => setFilters(f => ({ ...f, scoreMin: +e.target.value }))}
                    className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-500/40" />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase mb-2 block">Tendance</label>
                  <select value={filters.trend} onChange={e => setFilters(f => ({ ...f, trend: e.target.value as Filters["trend"] }))}
                    className="w-full bg-[#0d1117] border border-white/[0.08] rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-500/40">
                    <option value="all">Toutes</option>
                    <option value="bullish">🟢 Haussière</option>
                    <option value="bearish">🔴 Baissière</option>
                    <option value="neutral">⚪ Neutre</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase mb-2 block">Signal</label>
                  <select value={filters.signal} onChange={e => setFilters(f => ({ ...f, signal: e.target.value as Filters["signal"] }))}
                    className="w-full bg-[#0d1117] border border-white/[0.08] rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-500/40">
                    <option value="all">Tous</option>
                    <option value="BUY">✅ BUY</option>
                    <option value="SELL">❌ SELL</option>
                    <option value="NEUTRAL">➖ NEUTRAL</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase mb-2 block">Market Cap Min ($M)</label>
                  <input type="number" min={0} value={filters.minMarketCap} onChange={e => setFilters(f => ({ ...f, minMarketCap: +e.target.value }))}
                    className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-500/40" />
                </div>
                <div className="flex items-end">
                  <button onClick={() => setFilters(DEFAULT_FILTERS)}
                    className="w-full py-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-xs font-bold text-gray-400 transition-all border border-white/[0.06]">
                    Réinitialiser
                  </button>
                </div>
              </div>

              {/* Quick Presets */}
              <div className="flex gap-2 mt-4 flex-wrap">
                <span className="text-xs text-gray-600 font-bold self-center">Presets:</span>
                <button onClick={() => setFilters({ ...DEFAULT_FILTERS, rsiMax: 35, signal: "BUY", trend: "bullish" })}
                  className="px-3 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold hover:bg-emerald-500/20 transition-all">
                  🎯 Survendu + Haussier
                </button>
                <button onClick={() => setFilters({ ...DEFAULT_FILTERS, rsiMin: 65, signal: "SELL", trend: "bearish" })}
                  className="px-3 py-1 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold hover:bg-red-500/20 transition-all">
                  🔻 Suracheté + Baissier
                </button>
                <button onClick={() => setFilters({ ...DEFAULT_FILTERS, volumeRatioMin: 2, change24hMin: 3 })}
                  className="px-3 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-bold hover:bg-amber-500/20 transition-all">
                  🚀 Volume Explosif
                </button>
                <button onClick={() => setFilters({ ...DEFAULT_FILTERS, scoreMin: 70 })}
                  className="px-3 py-1 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-bold hover:bg-indigo-500/20 transition-all">
                  🏆 Score IA 70+
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input placeholder="Rechercher une crypto..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
            className="w-full bg-[#0d1117] border border-white/[0.06] rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-cyan-500/30" />
        </div>

        {/* Table */}
        <div className="bg-[#0d1117] border border-white/[0.06] rounded-2xl overflow-hidden">
          {loading && coins.length === 0 ? (
            <div className="flex items-center justify-center py-20 gap-3">
              <RefreshCw className="w-5 h-5 animate-spin text-cyan-400" />
              <span className="text-gray-500 text-sm">Chargement des données...</span>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px]">
                <thead>
                  <tr className="border-b border-white/[0.06]">
                    {[
                      { key: "name", label: "Actif" },
                      { key: "current_price", label: "Prix" },
                      { key: "price_change_percentage_24h", label: "24h" },
                      { key: "rsi", label: "RSI (14)" },
                      { key: "volumeRatio", label: "Vol. Ratio" },
                      { key: "volatility", label: "Volatilité" },
                      { key: "trend", label: "Tendance" },
                      { key: "signal", label: "Signal" },
                      { key: "score", label: "Score IA" },
                    ].map(col => (
                      <th key={col.key} onClick={() => toggleSort(col.key as keyof CoinScreener)}
                        className="text-left py-3 px-3 text-xs font-bold text-gray-500 uppercase cursor-pointer hover:text-gray-300 transition-colors select-none">
                        <div className="flex items-center gap-1">
                          {col.label}
                          <SortIcon col={col.key as keyof CoinScreener} />
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {paginated.map((c, i) => (
                    <tr key={c.id} className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors">
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2.5">
                          <span className="text-xs text-gray-600 w-5">{(page - 1) * PER_PAGE + i + 1}</span>
                          {c.image ? <img src={c.image} alt={c.symbol} className="w-7 h-7 rounded-full" /> : (
                            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-[10px] font-bold">
                              {c.symbol.slice(0, 2).toUpperCase()}
                            </div>
                          )}
                          <div>
                            <p className="text-sm font-bold">{c.name}</p>
                            <p className="text-[10px] text-gray-600 uppercase">{c.symbol}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-sm font-bold">{formatPrice(c.current_price)}</td>
                      <td className={`py-3 px-3 text-sm font-bold ${c.price_change_percentage_24h >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                        {c.price_change_percentage_24h >= 0 ? "+" : ""}{c.price_change_percentage_24h?.toFixed(1)}%
                      </td>
                      <td className="py-3 px-3"><RSIBar value={c.rsi ?? 50} /></td>
                      <td className="py-3 px-3">
                        <span className={`text-xs font-bold ${(c.volumeRatio ?? 1) >= 2 ? "text-amber-400" : (c.volumeRatio ?? 1) >= 1.5 ? "text-yellow-400" : "text-gray-500"}`}>
                          {c.volumeRatio?.toFixed(1)}x
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <span className={`text-xs font-bold ${(c.volatility ?? 0) > 10 ? "text-red-400" : (c.volatility ?? 0) > 5 ? "text-amber-400" : "text-gray-400"}`}>
                          {c.volatility?.toFixed(1)}%
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-md ${c.trend === "bullish" ? "bg-emerald-500/15 text-emerald-400" : c.trend === "bearish" ? "bg-red-500/15 text-red-400" : "bg-gray-500/15 text-gray-400"}`}>
                          {c.trend === "bullish" ? "🟢 Haussier" : c.trend === "bearish" ? "🔴 Baissier" : "⚪ Neutre"}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <span className={`text-xs font-bold px-2.5 py-1 rounded-lg ${c.signal === "BUY" ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20" : c.signal === "SELL" ? "bg-red-500/15 text-red-400 border border-red-500/20" : "bg-gray-500/10 text-gray-400 border border-gray-500/20"}`}>
                          {c.signal}
                        </span>
                      </td>
                      <td className="py-3 px-3"><ScoreRing score={c.score ?? 50} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-5 py-3 border-t border-white/[0.04]">
              <span className="text-xs text-gray-600">{filtered.length} résultats • Page {page}/{totalPages}</span>
              <div className="flex gap-2">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                  className="px-3 py-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-xs font-bold text-gray-400 disabled:opacity-30 transition-all">
                  ← Préc
                </button>
                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                  className="px-3 py-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-xs font-bold text-gray-400 disabled:opacity-30 transition-all">
                  Suiv →
                </button>
              </div>
            </div>
          )}
        </div>
        <Footer />
      </main>
    </div>
  );
}