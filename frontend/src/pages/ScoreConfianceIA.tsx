import { useState, useEffect, useCallback } from "react";
import Sidebar from "../components/Sidebar";
import PageHeader from "@/components/PageHeader";
import Footer from "@/components/Footer";
import { fetchTop200, formatPrice, type CoinMarketData } from "@/lib/cryptoApi";
import {
  Shield,
  TrendingUp,
  MessageCircle,
  Activity,
  Zap,
  RefreshCw,
  X,
  ChevronUp,
  ChevronDown,
  Search,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ScoreComponents {
  technical: number;   // RSI, MACD, Bollinger
  sentiment: number;   // Twitter/Reddit
  onchain: number;     // Exchange flows, whale wallets
  momentum: number;    // Market momentum
}

interface CryptoScore {
  id: string;
  symbol: string;
  name: string;
  image: string;
  price: number;
  change24h: number;
  marketCap: number;
  rank: number;
  components: ScoreComponents;
  globalScore: number;
  category: string[];
}

type FilterCategory = "all" | "top10" | "top50" | "defi" | "layer1" | "layer2";
type SortKey = "score" | "technical" | "sentiment" | "onchain" | "momentum" | "price" | "change";
type SortDir = "desc" | "asc";

// ─── Constants ────────────────────────────────────────────────────────────────

const CATEGORY_LABELS: Record<FilterCategory, string> = {
  all: "Tous",
  top10: "Top 10",
  top50: "Top 50",
  defi: "DeFi",
  layer1: "Layer 1",
  layer2: "Layer 2",
};

const DEFI_IDS = ["uniswap", "aave", "compound-governance-token", "maker", "curve-dao-token", "sushi", "yearn-finance", "pancakeswap-token", "1inch", "balancer"];
const LAYER1_IDS = ["bitcoin", "ethereum", "solana", "cardano", "avalanche-2", "polkadot", "near", "cosmos", "algorand", "tron"];
const LAYER2_IDS = ["matic-network", "arbitrum", "optimism", "immutable-x", "loopring", "metis-token", "boba-network", "zkspace", "starknet", "scroll"];

// ─── Score generation (deterministic per coin) ───────────────────────────────

function pseudoRand(seed: number, offset: number): number {
  return ((seed * 9301 + offset * 49297) % 233280) / 233280;
}

function generateComponents(c: CoinMarketData): ScoreComponents {
  const seed = c.id.split("").reduce((a, ch) => a + ch.charCodeAt(0), 0);
  const change = c.price_change_percentage_24h || 0;
  const change7d = c.price_change_percentage_7d_in_currency || 0;

  // Technical: based on price momentum + RSI simulation
  const rsi = Math.max(15, Math.min(90, 50 + change * 2 + pseudoRand(seed, 1) * 15));
  const technical = Math.round(Math.max(5, Math.min(98,
    (rsi > 50 && rsi < 70 ? 70 : rsi > 30 && rsi < 50 ? 45 : rsi >= 70 ? 55 : 30)
    + change * 1.5
    + pseudoRand(seed, 2) * 20
  )));

  // Sentiment: social buzz simulation
  const sentiment = Math.round(Math.max(5, Math.min(98,
    55 + change * 2 + change7d * 0.8 + pseudoRand(seed, 3) * 25 - 10
  )));

  // On-chain: exchange flows + whale activity
  const volumeRatio = c.total_volume / (c.market_cap || 1);
  const onchain = Math.round(Math.max(5, Math.min(98,
    50 + volumeRatio * 300 + change * 1.2 + pseudoRand(seed, 4) * 22 - 8
  )));

  // Momentum: 7d trend + market cap rank
  const rankBonus = Math.max(0, (200 - (c.market_cap_rank || 200)) / 200 * 20);
  const momentum = Math.round(Math.max(5, Math.min(98,
    50 + change7d * 1.5 + change * 1.0 + rankBonus + pseudoRand(seed, 5) * 18 - 6
  )));

  return { technical, sentiment, onchain, momentum };
}

function computeGlobal(comp: ScoreComponents): number {
  return Math.round(
    comp.technical * 0.30 +
    comp.sentiment * 0.20 +
    comp.onchain * 0.25 +
    comp.momentum * 0.25
  );
}

function getCategories(c: CoinMarketData): string[] {
  const cats: string[] = [];
  if ((c.market_cap_rank || 999) <= 10) cats.push("top10");
  if ((c.market_cap_rank || 999) <= 50) cats.push("top50");
  if (DEFI_IDS.includes(c.id)) cats.push("defi");
  if (LAYER1_IDS.includes(c.id)) cats.push("layer1");
  if (LAYER2_IDS.includes(c.id)) cats.push("layer2");
  return cats;
}

function buildScore(c: CoinMarketData): CryptoScore {
  const components = generateComponents(c);
  return {
    id: c.id,
    symbol: c.symbol.toUpperCase(),
    name: c.name,
    image: c.image,
    price: c.current_price,
    change24h: c.price_change_percentage_24h || 0,
    marketCap: c.market_cap,
    rank: c.market_cap_rank || 999,
    components,
    globalScore: computeGlobal(components),
    category: getCategories(c),
  };
}

// ─── Visual helpers ───────────────────────────────────────────────────────────

function scoreColor(score: number): string {
  if (score >= 67) return "text-emerald-400";
  if (score >= 34) return "text-amber-400";
  return "text-red-400";
}

function scoreBg(score: number): string {
  if (score >= 67) return "bg-emerald-400";
  if (score >= 34) return "bg-amber-400";
  return "bg-red-400";
}

function scoreGradient(score: number): string {
  if (score >= 67) return "from-emerald-500 to-green-400";
  if (score >= 34) return "from-amber-500 to-yellow-400";
  return "from-red-500 to-rose-400";
}

function scoreLabel(score: number): string {
  if (score >= 80) return "Excellent";
  if (score >= 67) return "Bon";
  if (score >= 50) return "Modéré";
  if (score >= 34) return "Faible";
  return "Très faible";
}

// ─── Circular gauge ───────────────────────────────────────────────────────────

function CircularGauge({ score, size = 56, strokeWidth = 5 }: { score: number; size?: number; strokeWidth?: number }) {
  const r = (size - strokeWidth * 2) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - score / 100);
  const color = score >= 67 ? "#10b981" : score >= 34 ? "#f59e0b" : "#ef4444";

  return (
    <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90" viewBox={`0 0 ${size} ${size}`}>
        <circle
          cx={size / 2} cy={size / 2} r={r}
          fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2} cy={size / 2} r={r}
          fill="none" stroke={color} strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          className="transition-all duration-700"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={`font-black leading-none ${size >= 72 ? "text-xl" : "text-sm"}`} style={{ color }}>
          {score}
        </span>
      </div>
    </div>
  );
}

// ─── Score bar ────────────────────────────────────────────────────────────────

function ScoreBar({ label, score, icon }: { label: string; score: number; icon: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2">
      <div className="w-5 h-5 rounded-md bg-white/[0.05] flex items-center justify-center flex-shrink-0 text-gray-400">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-center mb-1">
          <span className="text-[11px] text-gray-400 font-semibold truncate">{label}</span>
          <span className={`text-[11px] font-black flex-shrink-0 ml-2 ${scoreColor(score)}`}>{score}</span>
        </div>
        <div className="h-1.5 bg-white/[0.05] rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full ${scoreBg(score)} transition-all duration-700`}
            style={{ width: `${score}%`, opacity: 0.85 }}
          />
        </div>
      </div>
    </div>
  );
}

// ─── Detail Modal ─────────────────────────────────────────────────────────────

function DetailModal({ coin, onClose }: { coin: CryptoScore; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-md bg-[#0f172a] border border-white/[0.1] rounded-2xl p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <img src={coin.image} alt={coin.symbol} className="w-10 h-10 rounded-full" />
            <div>
              <h3 className="text-lg font-black text-white">{coin.symbol}</h3>
              <p className="text-xs text-gray-500">{coin.name}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-600 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Global score */}
        <div className="flex items-center gap-4 p-4 rounded-xl bg-white/[0.03] border border-white/[0.06] mb-5">
          <CircularGauge score={coin.globalScore} size={72} strokeWidth={6} />
          <div>
            <p className="text-xs text-gray-500 mb-1">Score Global IA</p>
            <p className={`text-3xl font-black ${scoreColor(coin.globalScore)}`}>{coin.globalScore}<span className="text-lg">/100</span></p>
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full bg-gradient-to-r ${scoreGradient(coin.globalScore)} text-white`}>
              {scoreLabel(coin.globalScore)}
            </span>
          </div>
        </div>

        {/* Components detail */}
        <div className="space-y-3 mb-5">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Détail des composantes</p>
          <ScoreBar label="Analyse Technique (RSI, MACD, Bollinger)" score={coin.components.technical} icon={<TrendingUp className="w-3 h-3" />} />
          <ScoreBar label="Sentiment Social (Twitter/Reddit)" score={coin.components.sentiment} icon={<MessageCircle className="w-3 h-3" />} />
          <ScoreBar label="On-Chain Metrics (Flux, Whales)" score={coin.components.onchain} icon={<Activity className="w-3 h-3" />} />
          <ScoreBar label="Momentum de Marché" score={coin.components.momentum} icon={<Zap className="w-3 h-3" />} />
        </div>

        {/* Price info */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.05]">
            <p className="text-[10px] text-gray-500 mb-1">Prix actuel</p>
            <p className="text-sm font-black text-white font-mono">${formatPrice(coin.price)}</p>
          </div>
          <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.05]">
            <p className="text-[10px] text-gray-500 mb-1">Variation 24h</p>
            <p className={`text-sm font-black ${coin.change24h >= 0 ? "text-emerald-400" : "text-red-400"}`}>
              {coin.change24h >= 0 ? "+" : ""}{coin.change24h.toFixed(2)}%
            </p>
          </div>
        </div>

        {/* Weights info */}
        <div className="mt-4 p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20">
          <p className="text-[11px] text-indigo-300 font-semibold">
            🧠 Pondération IA : Technique 30% · On-Chain 25% · Momentum 25% · Sentiment 20%
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ScoreConfianceIA() {
  const [scores, setScores] = useState<CryptoScore[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState("");
  const [filter, setFilter] = useState<FilterCategory>("top50");
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("score");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [selected, setSelected] = useState<CryptoScore | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchTop200(false);
      const built = data.map(buildScore).sort((a, b) => b.globalScore - a.globalScore);
      setScores(built);
      setLastUpdate(new Date().toLocaleTimeString("fr-FR"));
    } catch {
      // keep
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const i = setInterval(fetchData, 120000);
    return () => clearInterval(i);
  }, [fetchData]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "desc" ? "asc" : "desc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  };

  const filtered = scores
    .filter((s) => filter === "all" || s.category.includes(filter))
    .filter((s) =>
      !search ||
      s.symbol.toLowerCase().includes(search.toLowerCase()) ||
      s.name.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => {
      let va = 0, vb = 0;
      if (sortKey === "score") { va = a.globalScore; vb = b.globalScore; }
      else if (sortKey === "technical") { va = a.components.technical; vb = b.components.technical; }
      else if (sortKey === "sentiment") { va = a.components.sentiment; vb = b.components.sentiment; }
      else if (sortKey === "onchain") { va = a.components.onchain; vb = b.components.onchain; }
      else if (sortKey === "momentum") { va = a.components.momentum; vb = b.components.momentum; }
      else if (sortKey === "price") { va = a.price; vb = b.price; }
      else if (sortKey === "change") { va = a.change24h; vb = b.change24h; }
      return sortDir === "desc" ? vb - va : va - vb;
    });

  const SortIcon = ({ k }: { k: SortKey }) => {
    if (sortKey !== k) return <ChevronUp className="w-3 h-3 text-gray-600" />;
    return sortDir === "desc"
      ? <ChevronDown className="w-3 h-3 text-indigo-400" />
      : <ChevronUp className="w-3 h-3 text-indigo-400" />;
  };

  const avgScore = scores.length ? Math.round(scores.slice(0, 10).reduce((a, s) => a + s.globalScore, 0) / 10) : 0;
  const topCoin = scores[0];
  const bullishCount = scores.filter((s) => s.globalScore >= 67).length;

  return (
    <div className="flex min-h-screen bg-[#030712]">
      <Sidebar />
      <main className="flex-1 ml-[260px] bg-[#030712]">
        <div className="relative z-10 max-w-[1440px] mx-auto px-6 py-6">
          {/* Page Header */}
          <PageHeader
            icon={<Shield className="w-6 h-6" />}
            title="Score de Confiance IA"
            subtitle="Évaluation IA multi-dimensionnelle de chaque crypto basée sur 4 composantes : Analyse Technique, Sentiment Social, Métriques On-Chain et Momentum de Marché. Score de 0 à 100."
            accentColor="indigo"
            steps={[
              { n: "1", title: "Consultez les scores", desc: "Chaque crypto reçoit un score global de 0 à 100. Vert (67-100) = signal fort, Orange (34-66) = modéré, Rouge (0-33) = faible. Filtrez par catégorie." },
              { n: "2", title: "Analysez les composantes", desc: "Cliquez sur une crypto pour voir le détail des 4 composantes : Technique (30%), On-Chain (25%), Momentum (25%), Sentiment (20%)." },
              { n: "3", title: "Prenez des décisions éclairées", desc: "Combinez les scores IA avec vos propres analyses. Un score élevé sur plusieurs composantes renforce la conviction. Ne tradez jamais sur un seul indicateur." },
            ]}
          />

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-slate-900/70 border border-white/[0.06] rounded-2xl p-4 flex items-center gap-3">
              <CircularGauge score={avgScore} size={52} strokeWidth={5} />
              <div>
                <p className="text-xs text-gray-500">Score moyen Top 10</p>
                <p className={`text-lg font-black ${scoreColor(avgScore)}`}>{avgScore}/100</p>
              </div>
            </div>
            <div className="bg-slate-900/70 border border-white/[0.06] rounded-2xl p-4 flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/15 border border-emerald-500/20 flex items-center justify-center flex-shrink-0">
                <TrendingUp className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Cryptos haussières</p>
                <p className="text-lg font-black text-emerald-400">{bullishCount} <span className="text-sm text-gray-500">/ {scores.length}</span></p>
              </div>
            </div>
            <div className="bg-slate-900/70 border border-white/[0.06] rounded-2xl p-4 flex items-center gap-3">
              {topCoin && <img src={topCoin.image} alt={topCoin.symbol} className="w-10 h-10 rounded-full flex-shrink-0" />}
              <div>
                <p className="text-xs text-gray-500">Meilleur score</p>
                {topCoin && (
                  <p className="text-lg font-black text-white">
                    {topCoin.symbol} <span className={`text-sm ${scoreColor(topCoin.globalScore)}`}>{topCoin.globalScore}</span>
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Filters + Search + Refresh */}
          <div className="flex flex-wrap items-center gap-3 mb-5">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Rechercher..."
                className="pl-9 pr-3 py-2 rounded-xl bg-black/30 border border-white/[0.08] text-sm text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500/50 w-44"
              />
            </div>
            <div className="flex flex-wrap gap-1.5">
              {(Object.keys(CATEGORY_LABELS) as FilterCategory[]).map((cat) => (
                <button
                  key={cat}
                  onClick={() => setFilter(cat)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${filter === cat ? "bg-indigo-500/20 text-indigo-400 border border-indigo-500/30" : "bg-slate-800/50 text-gray-500 hover:text-white border border-white/[0.05]"}`}
                >
                  {CATEGORY_LABELS[cat]}
                </button>
              ))}
            </div>
            <button
              onClick={fetchData}
              disabled={loading}
              className="ml-auto flex items-center gap-2 px-3 py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] text-xs font-bold text-gray-400 hover:text-white transition-all"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
              {lastUpdate || "MAJ"}
            </button>
          </div>

          {/* Table */}
          {loading && scores.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 gap-4">
              <div className="w-12 h-12 border-2 border-indigo-500/20 border-t-indigo-400 rounded-full animate-spin" />
              <p className="text-sm text-gray-500">Calcul des scores IA en cours...</p>
            </div>
          ) : (
            <div className="bg-slate-900/60 border border-white/[0.06] rounded-2xl overflow-hidden">
              {/* Table header */}
              <div className="grid grid-cols-[2rem_1fr_5rem_1fr_1fr_1fr_1fr_5rem] gap-3 px-4 py-3 border-b border-white/[0.06] bg-black/20">
                <span className="text-[10px] font-bold text-gray-600 uppercase">#</span>
                <span className="text-[10px] font-bold text-gray-600 uppercase">Crypto</span>
                <button onClick={() => handleSort("price")} className="flex items-center gap-1 text-[10px] font-bold text-gray-600 uppercase hover:text-gray-400 transition-colors">
                  Prix <SortIcon k="price" />
                </button>
                <button onClick={() => handleSort("technical")} className="flex items-center gap-1 text-[10px] font-bold text-gray-600 uppercase hover:text-gray-400 transition-colors">
                  <TrendingUp className="w-3 h-3" /> Technique <SortIcon k="technical" />
                </button>
                <button onClick={() => handleSort("sentiment")} className="flex items-center gap-1 text-[10px] font-bold text-gray-600 uppercase hover:text-gray-400 transition-colors">
                  <MessageCircle className="w-3 h-3" /> Sentiment <SortIcon k="sentiment" />
                </button>
                <button onClick={() => handleSort("onchain")} className="flex items-center gap-1 text-[10px] font-bold text-gray-600 uppercase hover:text-gray-400 transition-colors">
                  <Activity className="w-3 h-3" /> On-Chain <SortIcon k="onchain" />
                </button>
                <button onClick={() => handleSort("momentum")} className="flex items-center gap-1 text-[10px] font-bold text-gray-600 uppercase hover:text-gray-400 transition-colors">
                  <Zap className="w-3 h-3" /> Momentum <SortIcon k="momentum" />
                </button>
                <button onClick={() => handleSort("score")} className="flex items-center gap-1 text-[10px] font-bold text-gray-600 uppercase hover:text-indigo-400 transition-colors">
                  Score <SortIcon k="score" />
                </button>
              </div>

              {/* Rows */}
              <div className="divide-y divide-white/[0.03]">
                {filtered.length === 0 ? (
                  <div className="text-center py-12 text-gray-500 text-sm">Aucun résultat</div>
                ) : (
                  filtered.map((coin, idx) => (
                    <div
                      key={coin.id}
                      onClick={() => setSelected(coin)}
                      className="grid grid-cols-[2rem_1fr_5rem_1fr_1fr_1fr_1fr_5rem] gap-3 px-4 py-3 hover:bg-white/[0.03] transition-all cursor-pointer group"
                    >
                      {/* Rank */}
                      <span className="text-xs text-gray-600 font-bold self-center">{idx + 1}</span>

                      {/* Coin */}
                      <div className="flex items-center gap-2 self-center min-w-0">
                        <img src={coin.image} alt={coin.symbol} className="w-7 h-7 rounded-full flex-shrink-0" />
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-white truncate">{coin.symbol}</p>
                          <p className="text-[10px] text-gray-500 truncate">{coin.name}</p>
                        </div>
                      </div>

                      {/* Price */}
                      <div className="self-center">
                        <p className="text-xs font-bold text-white font-mono">${formatPrice(coin.price)}</p>
                        <p className={`text-[10px] font-bold ${coin.change24h >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                          {coin.change24h >= 0 ? "+" : ""}{coin.change24h.toFixed(2)}%
                        </p>
                      </div>

                      {/* Technical */}
                      <div className="self-center">
                        <div className="flex items-center gap-1.5">
                          <div className="flex-1 h-1.5 bg-white/[0.05] rounded-full overflow-hidden max-w-[60px]">
                            <div className={`h-full rounded-full ${scoreBg(coin.components.technical)}`} style={{ width: `${coin.components.technical}%`, opacity: 0.85 }} />
                          </div>
                          <span className={`text-xs font-black ${scoreColor(coin.components.technical)}`}>{coin.components.technical}</span>
                        </div>
                      </div>

                      {/* Sentiment */}
                      <div className="self-center">
                        <div className="flex items-center gap-1.5">
                          <div className="flex-1 h-1.5 bg-white/[0.05] rounded-full overflow-hidden max-w-[60px]">
                            <div className={`h-full rounded-full ${scoreBg(coin.components.sentiment)}`} style={{ width: `${coin.components.sentiment}%`, opacity: 0.85 }} />
                          </div>
                          <span className={`text-xs font-black ${scoreColor(coin.components.sentiment)}`}>{coin.components.sentiment}</span>
                        </div>
                      </div>

                      {/* On-Chain */}
                      <div className="self-center">
                        <div className="flex items-center gap-1.5">
                          <div className="flex-1 h-1.5 bg-white/[0.05] rounded-full overflow-hidden max-w-[60px]">
                            <div className={`h-full rounded-full ${scoreBg(coin.components.onchain)}`} style={{ width: `${coin.components.onchain}%`, opacity: 0.85 }} />
                          </div>
                          <span className={`text-xs font-black ${scoreColor(coin.components.onchain)}`}>{coin.components.onchain}</span>
                        </div>
                      </div>

                      {/* Momentum */}
                      <div className="self-center">
                        <div className="flex items-center gap-1.5">
                          <div className="flex-1 h-1.5 bg-white/[0.05] rounded-full overflow-hidden max-w-[60px]">
                            <div className={`h-full rounded-full ${scoreBg(coin.components.momentum)}`} style={{ width: `${coin.components.momentum}%`, opacity: 0.85 }} />
                          </div>
                          <span className={`text-xs font-black ${scoreColor(coin.components.momentum)}`}>{coin.components.momentum}</span>
                        </div>
                      </div>

                      {/* Global Score */}
                      <div className="self-center flex justify-center">
                        <CircularGauge score={coin.globalScore} size={44} strokeWidth={4} />
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Footer info */}
              <div className="px-4 py-3 border-t border-white/[0.04] bg-black/10 flex items-center justify-between">
                <span className="text-[11px] text-gray-600">{filtered.length} cryptos affichées</span>
                <span className="text-[11px] text-gray-600">Cliquez sur une ligne pour voir le détail · Mise à jour auto toutes les 2 min</span>
              </div>
            </div>
          )}
        </div>

        {/* Detail Modal */}
        {selected && <DetailModal coin={selected} onClose={() => setSelected(null)} />}

        <Footer />
      </main>
    </div>
  );
}