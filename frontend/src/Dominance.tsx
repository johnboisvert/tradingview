import { useEffect, useState, useCallback, useRef } from "react";
import Sidebar from "@/components/Sidebar";
import { Crown, RefreshCw, TrendingUp, TrendingDown, Sparkles, PieChart, Bitcoin } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import Footer from "@/components/Footer";

interface CoinDom {
  id: string;
  symbol: string;
  name: string;
  market_cap: number;
  price: number;
  change24h: number;
  volume: number;
  image: string;
  dominance: number;
  color: string;
}

const COLORS = [
  "#f7931a", "#627eea", "#26a17b", "#f3ba2f", "#9945ff",
  "#00aae4", "#0033ad", "#e84142", "#2775ca", "#c3a634",
  "#8dc63f", "#ff007a", "#7c83fd", "#e6007a", "#00d395",
  "#ff6b35", "#7b3fe4", "#00b8d9", "#ff4081", "#4caf50",
  "#ff9800", "#9c27b0", "#00bcd4", "#795548", "#607d8b",
  "#e91e63", "#3f51b5", "#009688", "#ff5722", "#673ab7",
  "#2196f3", "#4caf50", "#ffc107", "#f44336", "#03a9f4",
  "#8bc34a", "#cddc39", "#ff5252", "#448aff", "#69f0ae",
  "#ffd740", "#ff6e40", "#7c4dff", "#18ffff", "#b388ff",
  "#82b1ff", "#a7ffeb", "#ccff90", "#ffe57f", "#ff80ab",
];

function formatNum(n: number): string {
  if (n >= 1e12) return `$${(n / 1e12).toFixed(2)}T`;
  if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
  return `$${n.toFixed(0)}`;
}

function useAnimatedNumber(target: number, duration = 1000): number {
  const [val, setVal] = useState(0);
  const startRef = useRef<number | null>(null);
  const fromRef = useRef(0);

  useEffect(() => {
    fromRef.current = val;
    startRef.current = null;
    let raf = 0;
    const step = (ts: number) => {
      if (startRef.current === null) startRef.current = ts;
      const elapsed = ts - startRef.current;
      const t = Math.min(1, elapsed / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setVal(fromRef.current + (target - fromRef.current) * eased);
      if (t < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target]);

  return val;
}

// ====================== DONUT CHART ======================
function DominanceDonut({ coins }: { coins: CoinDom[] }) {
  const top = coins.slice(0, 10);
  const otherDom = coins.slice(10).reduce((s, c) => s + c.dominance, 0);
  const items = [...top, ...(otherDom > 0 ? [{
    id: "others", symbol: "OTHERS", name: "Autres", color: "rgba(255,255,255,0.15)",
    dominance: otherDom, market_cap: 0, price: 0, change24h: 0, volume: 0, image: "",
  } as CoinDom] : [])];

  const R = 80;
  const cx = 110;
  const cy = 110;
  const circ = 2 * Math.PI * R;
  let accumulated = 0;

  return (
    <div className="relative w-full max-w-[260px] aspect-square mx-auto">
      <svg viewBox="0 0 220 220" className="w-full h-full -rotate-90">
        <defs>
          <filter id="domGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" />
            <feMerge>
              <feMergeNode />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <circle cx={cx} cy={cy} r={R} fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="22" />
        {items.map((c, i) => {
          const slice = (c.dominance / 100) * circ;
          const dashArr = `${slice} ${circ - slice}`;
          const offset = -accumulated;
          accumulated += slice;
          return (
            <circle
              key={i}
              cx={cx} cy={cy} r={R} fill="none"
              stroke={c.color}
              strokeWidth="22"
              strokeDasharray={dashArr}
              strokeDashoffset={offset}
              style={{ transition: "stroke-dasharray 1.2s cubic-bezier(.34,1.56,.64,1), stroke-dashoffset 1.2s cubic-bezier(.34,1.56,.64,1)" }}
              filter={i === 0 ? "url(#domGlow)" : undefined}
            />
          );
        })}
      </svg>
      {/* center label */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">Market Cap</span>
        <span className="text-lg font-black text-white mt-0.5">{formatNum(coins.reduce((s, c) => s + c.market_cap, 0))}</span>
        <span className="text-[10px] text-gray-500 mt-0.5">{coins.length} actifs</span>
      </div>
    </div>
  );
}

export default function Dominance() {
  const [coins, setCoins] = useState<CoinDom[]>([]);
  const [totalMC, setTotalMC] = useState(0);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState("");

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const { fetchTop200 } = await import("@/lib/cryptoApi");
      const allData = await fetchTop200(false);
      if (allData.length > 0) {
        const data = allData as any[];
        const total = data.reduce((s: number, c: any) => s + ((c.market_cap as number) || 0), 0);
        setTotalMC(total);
        setCoins(
          data.map((c: Record<string, unknown>, i: number) => ({
            id: c.id as string,
            symbol: ((c.symbol as string) || "").toUpperCase(),
            name: c.name as string,
            market_cap: (c.market_cap as number) || 0,
            price: (c.current_price as number) || 0,
            change24h: (c.price_change_percentage_24h as number) || 0,
            volume: (c.total_volume as number) || 0,
            image: c.image as string,
            dominance: total > 0 ? (((c.market_cap as number) || 0) / total) * 100 : 0,
            color: COLORS[i % COLORS.length],
          }))
        );
      }
      setLastUpdate(new Date().toLocaleTimeString("fr-FR"));
    } catch {
      // keep existing
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 60000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const btcDom = coins.find((c) => c.symbol === "BTC")?.dominance || 0;
  const ethDom = coins.find((c) => c.symbol === "ETH")?.dominance || 0;
  const altDom = Math.max(0, 100 - btcDom - ethDom);
  const stableDom = coins.filter((c) => ["USDT", "USDC", "DAI", "USDE", "FDUSD", "TUSD", "PYUSD"].includes(c.symbol))
    .reduce((s, c) => s + c.dominance, 0);

  const btcDomA = useAnimatedNumber(btcDom);
  const ethDomA = useAnimatedNumber(ethDom);
  const altDomA = useAnimatedNumber(altDom);
  const stableA = useAnimatedNumber(stableDom);

  // Phase detection based on BTC dominance
  let phase = "Équilibrée";
  let phaseColor = "#eab308";
  let phaseDesc = "Marché équilibré";
  if (btcDom >= 55) { phase = "BTC Season"; phaseColor = "#f7931a"; phaseDesc = "Bitcoin domine — accumulation"; }
  else if (btcDom <= 45) { phase = "Altseason Active"; phaseColor = "#22c55e"; phaseDesc = "Altcoins en surperformance"; }

  return (
    <div className="min-h-screen bg-[#0A0E1A] text-white">
      <Sidebar />
      <main className="md:ml-[260px] p-4 md:p-6 pt-[72px] md:pt-6 min-h-screen bg-[#0A0E1A]">
        <PageHeader
          icon={<Crown className="w-6 h-6" />}
          title="Dominance du Marché"
          subtitle="Analysez la répartition de la capitalisation boursière entre Bitcoin, Ethereum et les altcoins. La dominance BTC est un indicateur clé du cycle de marché."
          accentColor="amber"
          steps={[
            { n: "1", title: "Lisez la barre visuelle", desc: "La barre colorée en haut montre la répartition des Top 15 cryptos. Survolez chaque segment pour voir le pourcentage exact." },
            { n: "2", title: "Suivez la dominance BTC", desc: "BTC dom > 55% = marché dominé par Bitcoin (phase accumulation). BTC dom < 45% = altseason potentielle." },
            { n: "3", title: "Comparez les actifs", desc: "Le tableau détaillé vous permet de comparer market cap, volume et dominance de chaque crypto du Top 50." },
          ]}
        />

        {/* ===== HERO ===== */}
        <div className="relative rounded-3xl overflow-hidden mb-6 border border-white/[0.08]">
          <div className="absolute inset-0 bg-[#0A0E1A]" />
          <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-amber-500/20 blur-3xl" style={{ animation: "dom-pulse 6s ease-in-out infinite" }} />
          <div className="absolute -bottom-24 right-1/3 w-80 h-80 rounded-full bg-indigo-500/20 blur-3xl" style={{ animation: "dom-pulse 8s ease-in-out infinite reverse" }} />
          <div
            className="absolute inset-0 opacity-[0.04]"
            style={{
              backgroundImage:
                "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
              backgroundSize: "44px 44px",
            }}
          />
          <div className="relative z-10 flex items-center justify-between gap-4 px-6 md:px-10 py-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center" style={{ boxShadow: "0 0 30px rgba(251,191,36,0.25)" }}>
                <Crown className="w-7 h-7 text-amber-400" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-0.5">
                  <h1 className="text-xl md:text-2xl font-black">Dominance du Marché</h1>
                  <span
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border"
                    style={{ color: phaseColor, borderColor: `${phaseColor}55`, background: `${phaseColor}10` }}
                  >
                    <Sparkles className="w-2.5 h-2.5" /> {phase}
                  </span>
                </div>
                <p className="text-xs md:text-sm text-gray-400">{phaseDesc} • Top 50 cryptos en temps réel</p>
              </div>
            </div>
            <button
              onClick={fetchData}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.1] text-sm font-semibold transition-all disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
              <span className="hidden sm:inline">{lastUpdate ? `MAJ ${lastUpdate}` : "Rafraîchir"}</span>
            </button>
          </div>
        </div>

        <style>{`
          @keyframes dom-pulse {
            0%, 100% { transform: scale(1) translate(0,0); opacity: 0.25; }
            50% { transform: scale(1.15) translate(15px,-8px); opacity: 0.35; }
          }
          @keyframes dom-fadeUp {
            from { opacity: 0; transform: translateY(12px); }
            to { opacity: 1; transform: translateY(0); }
          }
          .dom-anim { animation: dom-fadeUp 0.6s ease-out both; }
        `}</style>

        {/* ===== KPIs ===== */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-6">
          {[
            { label: "Market Cap Total", value: formatNum(totalMC), color: "#a78bfa", icon: <PieChart className="w-5 h-5" />, sub: `${coins.length} actifs` },
            { label: "BTC Dominance", value: `${btcDomA.toFixed(1)}%`, color: "#f7931a", icon: <Bitcoin className="w-5 h-5" />, sub: btcDom > 55 ? "BTC Season" : btcDom < 45 ? "Altseason" : "Équilibré" },
            { label: "ETH Dominance", value: `${ethDomA.toFixed(1)}%`, color: "#627eea", icon: "⟠", sub: "Ethereum" },
            { label: "Altcoins", value: `${altDomA.toFixed(1)}%`, color: "#22d3ee", icon: "🌐", sub: `Stables: ${stableA.toFixed(1)}%` },
          ].map((k, i) => (
            <div
              key={i}
              className="dom-anim relative bg-gradient-to-br from-white/[0.04] to-white/[0.01] border border-white/[0.06] hover:border-white/[0.14] rounded-2xl p-4 md:p-5 overflow-hidden transition-all"
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <div className="absolute -top-12 -right-12 w-32 h-32 rounded-full blur-3xl opacity-20" style={{ background: k.color }} />
              <div className="relative">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[10px] md:text-xs text-gray-500 font-bold uppercase tracking-wider">{k.label}</p>
                  <span className="text-lg" style={{ color: k.color }}>{k.icon}</span>
                </div>
                <p className="text-2xl md:text-3xl font-black tracking-tight" style={{ color: k.color, textShadow: `0 0 20px ${k.color}30` }}>
                  {k.value}
                </p>
                <p className="text-[10px] md:text-xs text-gray-500 mt-1">{k.sub}</p>
              </div>
            </div>
          ))}
        </div>

        {/* ===== DONUT + VISUAL BAR ===== */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 md:gap-6 mb-6">
          {/* Donut */}
          <div
            className="dom-anim lg:col-span-2 relative bg-gradient-to-br from-white/[0.04] to-white/[0.01] border border-white/[0.08] rounded-3xl p-6 md:p-8 overflow-hidden"
            style={{ animationDelay: "200ms" }}
          >
            <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-72 h-72 rounded-full blur-3xl opacity-25 bg-amber-500" />
            <div className="relative">
              <h2 className="text-base md:text-lg font-bold mb-4 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                Répartition Top 10 + Autres
              </h2>
              <DominanceDonut coins={coins} />
              <div className="grid grid-cols-2 gap-1.5 mt-5">
                {coins.slice(0, 8).map((c) => (
                  <div key={c.id} className="flex items-center justify-between px-2 py-1.5 bg-white/[0.02] rounded-lg border border-white/[0.03]">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: c.color, boxShadow: `0 0 6px ${c.color}` }} />
                      <span className="text-[11px] font-bold text-gray-300 truncate">{c.symbol}</span>
                    </div>
                    <span className="text-[11px] font-black text-white">{c.dominance.toFixed(1)}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Visual Bar */}
          <div
            className="dom-anim lg:col-span-3 relative bg-gradient-to-br from-white/[0.04] to-white/[0.01] border border-white/[0.08] rounded-3xl p-6 md:p-8 overflow-hidden"
            style={{ animationDelay: "280ms" }}
          >
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base md:text-lg font-bold flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" /> Top 15 — Répartition Visuelle
              </h2>
              <span className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">Hover pour détails</span>
            </div>

            {/* Stacked bar */}
            <div className="flex h-14 rounded-2xl overflow-hidden ring-1 ring-white/[0.06]">
              {coins.slice(0, 15).map((c) => (
                <div
                  key={c.id}
                  className="h-full relative group cursor-pointer transition-all hover:brightness-125"
                  style={{
                    width: `${c.dominance}%`,
                    background: `linear-gradient(180deg, ${c.color}, ${c.color}dd)`,
                    minWidth: c.dominance > 0.5 ? "3px" : "0",
                    boxShadow: `inset 0 0 0 1px ${c.color}44`,
                  }}
                >
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 px-3 py-2 bg-black/95 backdrop-blur rounded-xl text-xs font-bold whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-10 border border-white/10 shadow-2xl">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ background: c.color }} />
                      <span className="text-white">{c.symbol}</span>
                      <span className="text-gray-400">·</span>
                      <span style={{ color: c.color }}>{c.dominance.toFixed(2)}%</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Legend grid */}
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 mt-5">
              {coins.slice(0, 15).map((c) => (
                <div key={c.id} className="flex items-center gap-1.5 px-2 py-1.5 bg-white/[0.02] hover:bg-white/[0.04] rounded-lg border border-white/[0.04] transition-colors">
                  <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: c.color, boxShadow: `0 0 6px ${c.color}` }} />
                  <span className="text-[10px] text-gray-300 font-bold truncate">{c.symbol}</span>
                  <span className="text-[10px] font-black ml-auto" style={{ color: c.color }}>{c.dominance.toFixed(1)}%</span>
                </div>
              ))}
            </div>

            {/* BTC vs ETH vs Alts split */}
            <div className="mt-6 pt-5 border-t border-white/[0.06]">
              <div className="text-[10px] text-gray-500 uppercase tracking-wider font-bold mb-2.5">BTC vs ETH vs Altcoins</div>
              <div className="flex h-3 rounded-full overflow-hidden ring-1 ring-white/[0.06]">
                <div className="h-full transition-all duration-1000" style={{ width: `${btcDom}%`, background: "linear-gradient(90deg,#f7931a,#fbbf24)" }} />
                <div className="h-full transition-all duration-1000" style={{ width: `${ethDom}%`, background: "linear-gradient(90deg,#627eea,#818cf8)" }} />
                <div className="h-full transition-all duration-1000" style={{ width: `${altDom}%`, background: "linear-gradient(90deg,#22d3ee,#a7f3d0)" }} />
              </div>
              <div className="flex justify-between mt-2 text-[10px] font-bold">
                <span className="text-amber-400">BTC {btcDom.toFixed(1)}%</span>
                <span className="text-indigo-400">ETH {ethDom.toFixed(1)}%</span>
                <span className="text-cyan-400">ALTS {altDom.toFixed(1)}%</span>
              </div>
            </div>
          </div>
        </div>

        {/* ===== FULL TABLE ===== */}
        <div
          className="dom-anim relative bg-gradient-to-br from-white/[0.04] to-white/[0.01] border border-white/[0.08] rounded-3xl p-6"
          style={{ animationDelay: "340ms" }}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base md:text-lg font-bold flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" /> Top 50 — Détails de la Dominance
            </h2>
            <span className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">{coins.length} actifs</span>
          </div>
          <div className="overflow-x-auto -mx-2 px-2">
            <table className="w-full min-w-[900px]">
              <thead>
                <tr className="border-b border-white/[0.08]">
                  {["#", "Crypto", "Prix", "24h", "Market Cap", "Volume 24h", "Dominance", "Barre"].map((h, i) => (
                    <th key={h} className={`py-3 px-3 text-[10px] font-bold text-gray-500 uppercase tracking-wider ${i >= 2 ? "text-right" : "text-left"}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {coins.map((c, i) => (
                  <tr
                    key={c.id}
                    className="border-b border-white/[0.03] hover:bg-white/[0.03] transition-colors"
                  >
                    <td className="py-3 px-3 text-sm text-gray-500 font-bold">{i + 1}</td>
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-3">
                        {c.image ? (
                          <img src={c.image} alt={c.symbol} className="w-7 h-7 rounded-full ring-1 ring-white/10" />
                        ) : (
                          <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold ring-1 ring-white/10" style={{ background: c.color }}>
                            {c.symbol.slice(0, 2)}
                          </div>
                        )}
                        <div>
                          <p className="text-sm font-bold">{c.name}</p>
                          <p className="text-[10px] text-gray-500 font-semibold">{c.symbol}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-right text-sm font-bold font-mono">
                      ${c.price >= 1 ? c.price.toLocaleString("en-US", { maximumFractionDigits: 2 }) : c.price.toFixed(6)}
                    </td>
                    <td className={`py-3 px-3 text-right text-sm font-bold ${c.change24h >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                      <div className="flex items-center justify-end gap-1">
                        {c.change24h >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                        {c.change24h >= 0 ? "+" : ""}{c.change24h.toFixed(2)}%
                      </div>
                    </td>
                    <td className="py-3 px-3 text-right text-sm text-gray-300 font-mono">{formatNum(c.market_cap)}</td>
                    <td className="py-3 px-3 text-right text-sm text-gray-300 font-mono">{formatNum(c.volume)}</td>
                    <td className="py-3 px-3 text-right text-sm font-black" style={{ color: c.color, textShadow: `0 0 10px ${c.color}40` }}>
                      {c.dominance.toFixed(2)}%
                    </td>
                    <td className="py-3 px-3 w-32">
                      <div className="w-full h-2 bg-white/[0.04] rounded-full overflow-hidden ring-1 ring-white/[0.04]">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${Math.min(c.dominance * 2, 100)}%`,
                            background: `linear-gradient(90deg, ${c.color}, ${c.color}aa)`,
                            boxShadow: `0 0 8px ${c.color}66`,
                            transition: "width 0.8s cubic-bezier(.34,1.56,.64,1)",
                          }}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <Footer />
      </main>
    </div>
  );
}
