import { useEffect, useState } from "react";
import Sidebar from "@/components/Sidebar";
import {
  TrendingUp,
  TrendingDown,
  Activity,
  DollarSign,
  BarChart3,
  Zap,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
} from "lucide-react";
import { fetchWithCorsProxy } from "@/lib/cryptoApi";
import Footer from "@/components/Footer";
import ShareButtons from "@/components/ShareButtons";
import MarketHours from "@/components/MarketHours";
import ExitIntentPopup from "@/components/ExitIntentPopup";
import OnboardingTour from "@/components/OnboardingTour";
import Testimonials from "@/components/Testimonials";

interface CoinData {
  id: string;
  symbol: string;
  name: string;
  current_price: number;
  price_change_percentage_24h: number;
  market_cap: number;
  total_volume: number;
  image: string;
  sparkline_in_7d?: { price: number[] };
}

interface GlobalData {
  total_market_cap: number;
  total_volume: number;
  btc_dominance: number;
  market_cap_change_24h: number;
}

const FALLBACK_COINS: CoinData[] = [
  { id: "bitcoin", symbol: "btc", name: "Bitcoin", current_price: 97250, price_change_percentage_24h: 2.4, market_cap: 1920000000000, total_volume: 48000000000, image: "" },
  { id: "ethereum", symbol: "eth", name: "Ethereum", current_price: 2720, price_change_percentage_24h: 1.8, market_cap: 327000000000, total_volume: 18000000000, image: "" },
  { id: "solana", symbol: "sol", name: "Solana", current_price: 195, price_change_percentage_24h: 3.5, market_cap: 95000000000, total_volume: 5200000000, image: "" },
  { id: "binancecoin", symbol: "bnb", name: "BNB", current_price: 650, price_change_percentage_24h: -0.8, market_cap: 97000000000, total_volume: 2100000000, image: "" },
  { id: "cardano", symbol: "ada", name: "Cardano", current_price: 0.78, price_change_percentage_24h: 4.2, market_cap: 27500000000, total_volume: 890000000, image: "" },
  { id: "ripple", symbol: "xrp", name: "XRP", current_price: 2.45, price_change_percentage_24h: -1.2, market_cap: 140000000000, total_volume: 4500000000, image: "" },
  { id: "dogecoin", symbol: "doge", name: "Dogecoin", current_price: 0.25, price_change_percentage_24h: 5.1, market_cap: 37000000000, total_volume: 2800000000, image: "" },
  { id: "avalanche-2", symbol: "avax", name: "Avalanche", current_price: 38.5, price_change_percentage_24h: 2.9, market_cap: 15800000000, total_volume: 780000000, image: "" },
];

const FALLBACK_GLOBAL: GlobalData = {
  total_market_cap: 3200000000000,
  total_volume: 120000000000,
  btc_dominance: 52.3,
  market_cap_change_24h: 1.8,
};

function formatNumber(n: number, decimals = 2): string {
  if (n >= 1e12) return `$${(n / 1e12).toFixed(decimals)}T`;
  if (n >= 1e9) return `$${(n / 1e9).toFixed(decimals)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(decimals)}M`;
  if (n >= 1e3) return `$${(n / 1e3).toFixed(decimals)}K`;
  return `$${n.toFixed(decimals)}`;
}

function formatPrice(p: number): string {
  if (p >= 1000) return `$${p.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
  if (p >= 1) return `$${p.toFixed(2)}`;
  return `$${p.toFixed(4)}`;
}

function MiniSparkline({ data, positive }: { data: number[]; positive: boolean }) {
  if (!data || data.length < 2) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const w = 80;
  const h = 32;
  const points = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - ((v - min) / range) * h}`).join(" ");

  return (
    <svg width={w} height={h} className="flex-shrink-0">
      <polyline
        points={points}
        fill="none"
        stroke={positive ? "#10B981" : "#EF4444"}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function FearGreedGauge({ value }: { value: number }) {
  const angleDeg = (value / 100) * 180 - 180;
  const angleRad = (angleDeg * Math.PI) / 180;
  const label =
    value <= 25 ? "Peur Extrême" : value <= 45 ? "Peur" : value <= 55 ? "Neutre" : value <= 75 ? "Avidité" : "Avidité Extrême";
  const color =
    value <= 25 ? "#EF4444" : value <= 45 ? "#F59E0B" : value <= 55 ? "#94A3B8" : value <= 75 ? "#10B981" : "#22C55E";

  const needleX = 70 + 45 * Math.cos(angleRad);
  const needleY = 75 + 45 * Math.sin(angleRad);

  return (
    <div className="flex flex-col items-center">
      <svg width="140" height="80" viewBox="0 0 140 80">
        <path d="M 10 75 A 60 60 0 0 1 130 75" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="10" strokeLinecap="round" />
        <path
          d="M 10 75 A 60 60 0 0 1 130 75"
          fill="none"
          stroke={color}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={`${(value / 100) * 188} 188`}
          className="transition-all duration-1000"
        />
        <line
          x1="70"
          y1="75"
          x2={needleX}
          y2={needleY}
          stroke="white"
          strokeWidth="2.5"
          strokeLinecap="round"
          className="transition-all duration-1000"
        />
        <circle cx="70" cy="75" r="4" fill="white" />
      </svg>
      <div className="text-center -mt-1">
        <span className="text-2xl font-extrabold" style={{ color }}>
          {value}
        </span>
        <p className="text-xs font-semibold text-gray-400 mt-0.5">{label}</p>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const [coins, setCoins] = useState<CoinData[]>(FALLBACK_COINS);
  const [global, setGlobal] = useState<GlobalData>(FALLBACK_GLOBAL);
  const [fearGreed, setFearGreed] = useState(65);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState("");

  const fetchData = async () => {
    setLoading(true);
    try {
      const { fetchTop200 } = await import("@/lib/cryptoApi");
      const [coinsData, globalRes, fgRes] = await Promise.allSettled([
        fetchTop200(true),
        fetch("/api/coingecko/global", { signal: AbortSignal.timeout(15000) }),
        fetchWithCorsProxy("https://api.alternative.me/fng/?limit=1"),
      ]);

      if (coinsData.status === "fulfilled" && coinsData.value.length > 0) {
        setCoins(coinsData.value as any);
      }

      if (globalRes.status === "fulfilled" && globalRes.value.ok) {
        const data = await globalRes.value.json();
        const gd = data?.data;
        if (gd) {
          setGlobal({
            total_market_cap: gd.total_market_cap?.usd || FALLBACK_GLOBAL.total_market_cap,
            total_volume: gd.total_volume?.usd || FALLBACK_GLOBAL.total_volume,
            btc_dominance: gd.market_cap_percentage?.btc || FALLBACK_GLOBAL.btc_dominance,
            market_cap_change_24h: gd.market_cap_change_percentage_24h_usd || FALLBACK_GLOBAL.market_cap_change_24h,
          });
        }
      }

      if (fgRes.status === "fulfilled" && fgRes.value.ok) {
        const data = await fgRes.value.json();
        const val = data?.data?.[0]?.value;
        if (val) setFearGreed(parseInt(val));
      }

      setLastUpdate(new Date().toLocaleTimeString("fr-FR"));
    } catch {
      // Keep fallback data
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 60000);
    return () => clearInterval(interval);
  }, []);

  const topGainers = [...coins].sort((a, b) => b.price_change_percentage_24h - a.price_change_percentage_24h).slice(0, 3);
  const topLosers = [...coins].sort((a, b) => a.price_change_percentage_24h - b.price_change_percentage_24h).slice(0, 3);

  return (
    <div className="min-h-screen bg-[#0A0E1A] text-white">
      <Sidebar />
      {/* pt-14 on mobile for the fixed top bar, md:pt-0 on desktop */}
      <main className="md:ml-[260px] p-4 md:p-6 pt-[72px] md:pt-6 min-h-screen">

        {/* ===== AI MARKET SCORE WIDGET (Conversion Booster) ===== */}
        <div className="relative rounded-3xl overflow-hidden mb-6 border border-white/[0.08]" style={{ background: "linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)" }}>
          {(() => {
            // Compute AI score from real data
            const aiScore = Math.max(0, Math.min(100, Math.round(
              fearGreed * 0.45 +
              Math.max(0, Math.min(100, 50 + global.market_cap_change_24h * 5)) * 0.35 +
              Math.max(0, Math.min(100, 50 + (global.btc_dominance - 50) * 0.5)) * 0.2
            )));
            const aiColor = aiScore >= 75 ? "#22c55e" : aiScore >= 55 ? "#84cc16" : aiScore >= 40 ? "#eab308" : aiScore >= 25 ? "#f97316" : "#ef4444";
            const aiLabel = aiScore >= 75 ? "🚀 BULL EXTRÊME" : aiScore >= 55 ? "📈 HAUSSIER" : aiScore >= 40 ? "⚖️ NEUTRE" : aiScore >= 25 ? "📉 BAISSIER" : "🐻 BEAR EXTRÊME";
            const aiAction = aiScore >= 75 ? "Marché euphorique — prendre des profits" : aiScore >= 55 ? "Conditions favorables au long" : aiScore >= 40 ? "Marché indécis — attendre" : aiScore >= 25 ? "Prudence — réduire exposition" : "Opportunité d'accumulation long terme";
            return (
              <>
                <div className="absolute -top-32 -left-32 w-[500px] h-[500px] rounded-full blur-3xl opacity-30" style={{ background: aiColor, animation: "ai-mega 4s ease-in-out infinite" }} />
                <div className="absolute -bottom-32 -right-32 w-[450px] h-[450px] rounded-full blur-3xl opacity-25" style={{ background: aiColor, animation: "ai-mega 5s ease-in-out infinite reverse" }} />
                <div className="absolute inset-0 opacity-[0.05]" style={{ backgroundImage: "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)", backgroundSize: "30px 30px" }} />
                <div className="relative z-10 p-6 md:p-8 flex flex-col md:flex-row items-center gap-6 md:gap-10">
                  {/* Big animated score */}
                  <div className="flex-shrink-0 text-center">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.08] border border-white/[0.15] mb-3">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      <span className="text-[10px] font-bold uppercase tracking-widest text-white">Score IA temps réel</span>
                    </div>
                    <div className="relative">
                      <div className="text-[110px] md:text-[140px] font-black leading-none tracking-tight font-mono" style={{ color: aiColor, textShadow: `0 0 60px ${aiColor}, 0 0 100px ${aiColor}66` }}>
                        {aiScore}
                      </div>
                      <div className="absolute -top-2 right-0 text-2xl md:text-3xl font-bold text-gray-500">/100</div>
                    </div>
                    <div className="text-xl md:text-2xl font-black tracking-tight mt-2" style={{ color: aiColor, textShadow: `0 0 20px ${aiColor}66` }}>
                      {aiLabel}
                    </div>
                  </div>

                  {/* Bar + action */}
                  <div className="flex-1 w-full">
                    <div className="text-xs md:text-sm text-gray-300 mb-3 font-semibold flex items-center gap-2 flex-wrap">
                      <span>💡 <strong className="text-white">Analyse IA combinée :</strong></span>
                      <span className="px-2 py-0.5 rounded-md bg-white/[0.06] text-gray-300">Fear&amp;Greed {fearGreed}</span>
                      <span className="px-2 py-0.5 rounded-md bg-white/[0.06] text-gray-300">MCap {global.market_cap_change_24h >= 0 ? "+" : ""}{global.market_cap_change_24h.toFixed(1)}%</span>
                      <span className="px-2 py-0.5 rounded-md bg-white/[0.06] text-gray-300">BTC Dom {global.btc_dominance.toFixed(1)}%</span>
                    </div>
                    <div className="relative h-5 bg-white/[0.04] rounded-2xl overflow-hidden ring-1 ring-white/[0.08] mb-3">
                      <div className="absolute inset-0 flex">
                        <div className="h-full" style={{ width: "20%", background: "linear-gradient(90deg, rgba(239,68,68,0.4), rgba(239,68,68,0.2))" }} />
                        <div className="h-full" style={{ width: "20%", background: "linear-gradient(90deg, rgba(249,115,22,0.4), rgba(249,115,22,0.2))" }} />
                        <div className="h-full" style={{ width: "20%", background: "linear-gradient(90deg, rgba(234,179,8,0.4), rgba(234,179,8,0.2))" }} />
                        <div className="h-full" style={{ width: "20%", background: "linear-gradient(90deg, rgba(132,204,22,0.4), rgba(132,204,22,0.2))" }} />
                        <div className="h-full" style={{ width: "20%", background: "linear-gradient(90deg, rgba(34,197,94,0.4), rgba(34,197,94,0.2))" }} />
                      </div>
                      <div className="absolute top-[-2px] w-1 h-[calc(100%+4px)] bg-white rounded-sm z-10" style={{ left: `${aiScore}%`, boxShadow: `0 0 14px white, 0 0 28px ${aiColor}`, transition: "left 1s cubic-bezier(.34,1.56,.64,1)" }} />
                    </div>
                    <div className="flex items-start gap-2 p-3 rounded-xl border" style={{ background: `${aiColor}10`, borderColor: `${aiColor}33` }}>
                      <span className="text-xl">🎯</span>
                      <div>
                        <div className="text-[10px] font-bold uppercase tracking-widest" style={{ color: aiColor }}>Recommandation IA</div>
                        <div className="text-sm font-bold text-white mt-0.5">{aiAction}</div>
                      </div>
                    </div>
                  </div>
                </div>
                <style>{`
                  @keyframes ai-mega {
                    0%, 100% { transform: scale(1) translate(0,0); opacity: 0.3; }
                    50% { transform: scale(1.25) translate(30px,-15px); opacity: 0.5; }
                  }
                `}</style>
              </>
            );
          })()}
        </div>

        {/* Hero (premium CSS-only) */}
        <div className="relative rounded-3xl overflow-hidden mb-6 border border-white/[0.08]">
          <div className="absolute inset-0 bg-[#0A0E1A]" />
          <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-indigo-500/25 blur-3xl" style={{ animation: "idx-pulse 6s ease-in-out infinite" }} />
          <div className="absolute -bottom-24 right-1/4 w-80 h-80 rounded-full bg-cyan-500/25 blur-3xl" style={{ animation: "idx-pulse 8s ease-in-out infinite reverse" }} />
          <div className="absolute -top-12 right-1/2 w-72 h-72 rounded-full bg-purple-500/15 blur-3xl" style={{ animation: "idx-pulse 7s ease-in-out infinite" }} />
          <div className="absolute inset-0 opacity-[0.04]" style={{
            backgroundImage: "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
            backgroundSize: "44px 44px",
          }} />
          <div className="relative z-10 flex items-center justify-between gap-4 px-6 md:px-10 py-7">
            <div>
              <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                <h1 className="text-2xl md:text-4xl font-black tracking-tight">
                  <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent">CryptoIA</span>
                  <span className="hidden sm:inline text-white"> Trading Platform</span>
                </h1>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border border-emerald-500/40 bg-emerald-500/10 text-emerald-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Live
                </span>
              </div>
              <p className="text-xs md:text-sm text-gray-400 hidden sm:block">
                📡 Données temps réel • 🤖 Analyse IA • 🛠️ Outils professionnels
              </p>
            </div>
            <button onClick={fetchData} disabled={loading}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.1] text-xs md:text-sm font-semibold transition-all disabled:opacity-50">
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
              <span className="hidden sm:inline">{lastUpdate ? `MAJ ${lastUpdate}` : "Rafraîchir"}</span>
            </button>
          </div>
        </div>

        <style>{`
          @keyframes idx-pulse {
            0%, 100% { transform: scale(1) translate(0,0); opacity: 0.3; }
            50% { transform: scale(1.2) translate(20px,-10px); opacity: 0.45; }
          }
          @keyframes idx-fadeUp {
            from { opacity: 0; transform: translateY(12px); }
            to { opacity: 1; transform: translateY(0); }
          }
          .idx-anim { animation: idx-fadeUp 0.6s ease-out both; }
        `}</style>

        {/* Global Stats */}
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 md:gap-4 mb-6">
          <div className="idx-anim relative bg-gradient-to-br from-white/[0.04] to-white/[0.01] border border-white/[0.06] hover:border-white/[0.14] rounded-2xl p-4 md:p-5 transition-all overflow-hidden" style={{ animationDelay: "60ms" }}>
            <div className="absolute -top-12 -right-12 w-32 h-32 rounded-full bg-indigo-500/20 blur-3xl" />
            <div className="relative">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] md:text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Market Cap</p>
                  <p className="text-base md:text-xl font-black" style={{ color: "#a78bfa", textShadow: "0 0 12px rgba(167,139,250,0.3)" }}>{formatNumber(global.total_market_cap)}</p>
                </div>
                <div className="w-9 h-9 md:w-10 md:h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center flex-shrink-0" style={{ boxShadow: "0 0 18px rgba(99,102,241,0.4)" }}>
                  <DollarSign className="w-4 h-4 md:w-5 md:h-5 text-white" />
                </div>
              </div>
              <div className={`flex items-center gap-1 mt-2 text-xs font-bold ${global.market_cap_change_24h >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                {global.market_cap_change_24h >= 0 ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                <span>{global.market_cap_change_24h.toFixed(1)}%</span>
              </div>
            </div>
          </div>

          <div className="idx-anim relative bg-gradient-to-br from-white/[0.04] to-white/[0.01] border border-white/[0.06] hover:border-white/[0.14] rounded-2xl p-4 md:p-5 transition-all overflow-hidden" style={{ animationDelay: "120ms" }}>
            <div className="absolute -top-12 -right-12 w-32 h-32 rounded-full bg-cyan-500/20 blur-3xl" />
            <div className="relative">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] md:text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Volume 24h</p>
                  <p className="text-base md:text-xl font-black" style={{ color: "#22d3ee", textShadow: "0 0 12px rgba(34,211,238,0.3)" }}>{formatNumber(global.total_volume)}</p>
                </div>
                <div className="w-9 h-9 md:w-10 md:h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-cyan-600 flex items-center justify-center flex-shrink-0" style={{ boxShadow: "0 0 18px rgba(6,182,212,0.4)" }}>
                  <Activity className="w-4 h-4 md:w-5 md:h-5 text-white" />
                </div>
              </div>
            </div>
          </div>

          <div className="idx-anim relative bg-gradient-to-br from-white/[0.04] to-white/[0.01] border border-white/[0.06] hover:border-white/[0.14] rounded-2xl p-4 md:p-5 transition-all overflow-hidden" style={{ animationDelay: "180ms" }}>
            <div className="absolute -top-12 -right-12 w-32 h-32 rounded-full bg-amber-500/20 blur-3xl" />
            <div className="relative">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] md:text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">BTC Dom.</p>
                  <p className="text-base md:text-xl font-black" style={{ color: "#fbbf24", textShadow: "0 0 12px rgba(251,191,36,0.3)" }}>{global.btc_dominance.toFixed(1)}%</p>
                </div>
                <div className="w-9 h-9 md:w-10 md:h-10 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center flex-shrink-0" style={{ boxShadow: "0 0 18px rgba(245,158,11,0.4)" }}>
                  <BarChart3 className="w-4 h-4 md:w-5 md:h-5 text-white" />
                </div>
              </div>
            </div>
          </div>

          <div className="idx-anim relative bg-gradient-to-br from-white/[0.04] to-white/[0.01] border border-white/[0.06] hover:border-white/[0.14] rounded-2xl p-4 md:p-5 transition-all col-span-2 xl:col-span-1 overflow-hidden" style={{ animationDelay: "240ms" }}>
            <div className="absolute -top-12 -right-12 w-32 h-32 rounded-full bg-pink-500/15 blur-3xl" />
            <div className="relative">
              <FearGreedGauge value={fearGreed} />
            </div>
          </div>
        </div>

        {/* Top Gainers / Losers */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
          <div className="bg-[#111827] border border-white/[0.06] rounded-2xl p-4 md:p-5">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-5 h-5 text-emerald-400" />
              <h2 className="text-sm md:text-base font-bold">Top Gainers (24h)</h2>
            </div>
            <div className="space-y-2 md:space-y-3">
              {topGainers.map((c) => (
                <div key={c.id} className="flex items-center justify-between py-2 px-3 rounded-xl hover:bg-white/[0.03] transition-colors">
                  <div className="flex items-center gap-3">
                    {c.image ? (
                      <img src={c.image} alt={c.symbol} className="w-7 h-7 md:w-8 md:h-8 rounded-full" />
                    ) : (
                      <div className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center text-xs font-bold flex-shrink-0">
                        {c.symbol.slice(0, 2).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <p className="text-xs md:text-sm font-bold">{c.name}</p>
                      <p className="text-[10px] md:text-xs text-gray-500 uppercase">{c.symbol}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs md:text-sm font-bold">{formatPrice(c.current_price)}</p>
                    <p className="text-[10px] md:text-xs font-bold text-emerald-400">+{c.price_change_percentage_24h.toFixed(1)}%</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-[#111827] border border-white/[0.06] rounded-2xl p-4 md:p-5">
            <div className="flex items-center gap-2 mb-4">
              <TrendingDown className="w-5 h-5 text-red-400" />
              <h2 className="text-sm md:text-base font-bold">Top Losers (24h)</h2>
            </div>
            <div className="space-y-2 md:space-y-3">
              {topLosers.map((c) => (
                <div key={c.id} className="flex items-center justify-between py-2 px-3 rounded-xl hover:bg-white/[0.03] transition-colors">
                  <div className="flex items-center gap-3">
                    {c.image ? (
                      <img src={c.image} alt={c.symbol} className="w-7 h-7 md:w-8 md:h-8 rounded-full" />
                    ) : (
                      <div className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center text-xs font-bold flex-shrink-0">
                        {c.symbol.slice(0, 2).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <p className="text-xs md:text-sm font-bold">{c.name}</p>
                      <p className="text-[10px] md:text-xs text-gray-500 uppercase">{c.symbol}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs md:text-sm font-bold">{formatPrice(c.current_price)}</p>
                    <p className="text-[10px] md:text-xs font-bold text-red-400">{c.price_change_percentage_24h.toFixed(1)}%</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Market Hours */}
        <MarketHours />

        {/* Coins Table */}
        <div className="bg-[#111827] border border-white/[0.06] rounded-2xl p-4 md:p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-indigo-400" />
              <h2 className="text-sm md:text-base font-bold">Marché Crypto</h2>
            </div>
            <span className="text-xs text-gray-500">{coins.length} actifs</span>
          </div>

          {/* Mobile card list */}
          <div className="md:hidden space-y-2">
            {coins.slice(0, 10).map((c, i) => {
              const positive = c.price_change_percentage_24h >= 0;
              return (
                <div key={c.id} className="flex items-center justify-between py-2.5 px-3 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-gray-600 font-bold w-4">{i + 1}</span>
                    {c.image ? (
                      <img src={c.image} alt={c.symbol} className="w-7 h-7 rounded-full" />
                    ) : (
                      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-[10px] font-bold flex-shrink-0">
                        {c.symbol.slice(0, 2).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <p className="text-xs font-bold">{c.name}</p>
                      <p className="text-[10px] text-gray-500 uppercase">{c.symbol}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold">{formatPrice(c.current_price)}</p>
                    <p className={`text-[10px] font-bold ${positive ? "text-emerald-400" : "text-red-400"}`}>
                      {positive ? "+" : ""}{c.price_change_percentage_24h?.toFixed(1)}%
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Desktop table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full min-w-[700px]">
              <thead>
                <tr className="border-b border-white/[0.06]">
                  <th className="text-left py-3 px-3 text-xs font-bold text-gray-500 uppercase">#</th>
                  <th className="text-left py-3 px-3 text-xs font-bold text-gray-500 uppercase">Actif</th>
                  <th className="text-right py-3 px-3 text-xs font-bold text-gray-500 uppercase">Prix</th>
                  <th className="text-right py-3 px-3 text-xs font-bold text-gray-500 uppercase">24h</th>
                  <th className="text-right py-3 px-3 text-xs font-bold text-gray-500 uppercase">Market Cap</th>
                  <th className="text-right py-3 px-3 text-xs font-bold text-gray-500 uppercase">Volume</th>
                  <th className="text-right py-3 px-3 text-xs font-bold text-gray-500 uppercase">7j</th>
                </tr>
              </thead>
              <tbody>
                {coins.slice(0, 15).map((c, i) => {
                  const positive = c.price_change_percentage_24h >= 0;
                  const sparkData = c.sparkline_in_7d?.price;
                  return (
                    <tr key={c.id} className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors">
                      <td className="py-3 px-3 text-sm text-gray-500 font-semibold">{i + 1}</td>
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-3">
                          {c.image ? (
                            <img src={c.image} alt={c.symbol} className="w-7 h-7 rounded-full" />
                          ) : (
                            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-[10px] font-bold">
                              {c.symbol.slice(0, 2).toUpperCase()}
                            </div>
                          )}
                          <div>
                            <p className="text-sm font-bold">{c.name}</p>
                            <p className="text-xs text-gray-500 uppercase">{c.symbol}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-right text-sm font-bold">{formatPrice(c.current_price)}</td>
                      <td className={`py-3 px-3 text-right text-sm font-bold ${positive ? "text-emerald-400" : "text-red-400"}`}>
                        {positive ? "+" : ""}
                        {c.price_change_percentage_24h?.toFixed(1)}%
                      </td>
                      <td className="py-3 px-3 text-right text-sm text-gray-300">{formatNumber(c.market_cap, 1)}</td>
                      <td className="py-3 px-3 text-right text-sm text-gray-300">{formatNumber(c.total_volume, 1)}</td>
                      <td className="py-3 px-3 text-right">
                        {sparkData && sparkData.length > 10 ? (
                          <MiniSparkline data={sparkData.slice(-24)} positive={positive} />
                        ) : (
                          <span className="text-xs text-gray-600">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* ===== Testimonials Section ===== */}
        <Testimonials />

        <Footer />
        <ShareButtons title="CryptoIA — Analyse Crypto IA & Signaux de Trading" />
      </main>
      <ExitIntentPopup />
      <OnboardingTour />
    </div>
  );
}
