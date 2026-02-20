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
import Footer from "@/components/Footer";

const HERO_IMG =
  "https://mgx-backend-cdn.metadl.com/generate/images/966405/2026-02-18/6e7996e5-3fd7-4958-9f83-5d5f09ef989f.png";

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
        fetch("https://api.coingecko.com/api/v3/global"),
        fetch("https://api.alternative.me/fng/?limit=1"),
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

        {/* Hero */}
        <div className="relative rounded-2xl overflow-hidden mb-6 h-[120px] md:h-[160px]">
          <img src={HERO_IMG} alt="" className="absolute inset-0 w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0A0E1A]/95 via-[#0A0E1A]/70 to-transparent" />
          <div className="relative z-10 h-full flex items-center justify-between px-4 md:px-8">
            <div>
              <h1 className="text-xl md:text-3xl font-extrabold tracking-tight mb-1">
                <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent">
                  CryptoIA
                </span>{" "}
                <span className="hidden sm:inline">Trading Platform</span>
              </h1>
              <p className="text-xs md:text-sm text-gray-400 hidden sm:block">
                Données en temps réel • Analyse IA • Outils professionnels
              </p>
            </div>
            <button
              onClick={fetchData}
              disabled={loading}
              className="flex items-center gap-1.5 md:gap-2 px-3 md:px-4 py-2 md:py-2.5 rounded-xl bg-white/[0.08] hover:bg-white/[0.12] border border-white/[0.08] text-xs md:text-sm font-semibold transition-all"
            >
              <RefreshCw className={`w-3.5 h-3.5 md:w-4 md:h-4 ${loading ? "animate-spin" : ""}`} />
              <span className="hidden sm:inline">{lastUpdate ? `MAJ ${lastUpdate}` : "Rafraîchir"}</span>
            </button>
          </div>
        </div>

        {/* Global Stats */}
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 md:gap-4 mb-6">
          <div className="bg-[#111827] border border-white/[0.06] rounded-2xl p-4 md:p-5 hover:border-white/[0.12] transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] md:text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Market Cap</p>
                <p className="text-base md:text-xl font-extrabold">{formatNumber(global.total_market_cap)}</p>
              </div>
              <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center flex-shrink-0">
                <DollarSign className="w-4 h-4 md:w-5 md:h-5 text-white" />
              </div>
            </div>
            <div className={`flex items-center gap-1 mt-2 text-xs font-bold ${global.market_cap_change_24h >= 0 ? "text-emerald-400" : "text-red-400"}`}>
              {global.market_cap_change_24h >= 0 ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
              <span>{global.market_cap_change_24h.toFixed(1)}%</span>
            </div>
          </div>

          <div className="bg-[#111827] border border-white/[0.06] rounded-2xl p-4 md:p-5 hover:border-white/[0.12] transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] md:text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Volume 24h</p>
                <p className="text-base md:text-xl font-extrabold">{formatNumber(global.total_volume)}</p>
              </div>
              <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-cyan-600 flex items-center justify-center flex-shrink-0">
                <Activity className="w-4 h-4 md:w-5 md:h-5 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-[#111827] border border-white/[0.06] rounded-2xl p-4 md:p-5 hover:border-white/[0.12] transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] md:text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">BTC Dom.</p>
                <p className="text-base md:text-xl font-extrabold">{global.btc_dominance.toFixed(1)}%</p>
              </div>
              <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center flex-shrink-0">
                <BarChart3 className="w-4 h-4 md:w-5 md:h-5 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-[#111827] border border-white/[0.06] rounded-2xl p-4 md:p-5 hover:border-white/[0.12] transition-all col-span-2 xl:col-span-1">
            <FearGreedGauge value={fearGreed} />
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
        <Footer />
      </main>
    </div>
  );
}