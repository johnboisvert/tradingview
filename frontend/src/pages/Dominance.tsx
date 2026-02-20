import { useEffect, useState, useCallback } from "react";
import Sidebar from "@/components/Sidebar";
import { Crown, RefreshCw, TrendingUp, TrendingDown } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import Footer from "@/components/Footer";

const DOM_BG =
  "https://mgx-backend-cdn.metadl.com/generate/images/966405/2026-02-18/6e7996e5-3fd7-4958-9f83-5d5f09ef989f.png";

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
  "#8dc63f", "#ff007a", "#1a1a2e", "#e6007a", "#00d395",
  "#3c3c3d", "#ff6b35", "#7b3fe4", "#00b8d9", "#ff4081",
  "#4caf50", "#ff9800", "#9c27b0", "#00bcd4", "#795548",
  "#607d8b", "#e91e63", "#3f51b5", "#009688", "#ff5722",
  "#673ab7", "#2196f3", "#4caf50", "#ffc107", "#f44336",
  "#03a9f4", "#8bc34a", "#cddc39", "#ff5252", "#448aff",
  "#69f0ae", "#ffd740", "#ff6e40", "#7c4dff", "#18ffff",
  "#b388ff", "#82b1ff", "#a7ffeb", "#ccff90", "#ffe57f",
];

function formatNum(n: number): string {
  if (n >= 1e12) return `$${(n / 1e12).toFixed(2)}T`;
  if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
  return `$${n.toFixed(0)}`;
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
  const altDom = 100 - btcDom - ethDom;

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
        {/* Hero */}
        <div className="relative rounded-2xl overflow-hidden mb-6 h-[140px]">
          <img src={DOM_BG} alt="" className="absolute inset-0 w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0A0E1A]/95 via-[#0A0E1A]/75 to-transparent" />
          <div className="relative z-10 h-full flex items-center justify-between px-8">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <Crown className="w-7 h-7 text-amber-400" />
                <h1 className="text-2xl font-extrabold">Dominance du Marché</h1>
              </div>
              <p className="text-sm text-gray-400">Répartition de la capitalisation • Top 50 cryptos en temps réel</p>
            </div>
            <button
              onClick={fetchData} disabled={loading}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/[0.08] hover:bg-white/[0.12] border border-white/[0.08] text-sm font-semibold transition-all"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
              {lastUpdate ? `MAJ ${lastUpdate}` : "Rafraîchir"}
            </button>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
          <div className="bg-[#111827] border border-white/[0.06] rounded-2xl p-5">
            <p className="text-xs text-gray-500 font-semibold mb-1">Market Cap Total</p>
            <p className="text-2xl font-extrabold">{formatNum(totalMC)}</p>
          </div>
          <div className="bg-[#111827] border border-white/[0.06] rounded-2xl p-5">
            <p className="text-xs text-gray-500 font-semibold mb-1">BTC Dominance</p>
            <p className="text-2xl font-extrabold text-amber-400">{btcDom.toFixed(1)}%</p>
          </div>
          <div className="bg-[#111827] border border-white/[0.06] rounded-2xl p-5">
            <p className="text-xs text-gray-500 font-semibold mb-1">ETH Dominance</p>
            <p className="text-2xl font-extrabold text-indigo-400">{ethDom.toFixed(1)}%</p>
          </div>
          <div className="bg-[#111827] border border-white/[0.06] rounded-2xl p-5">
            <p className="text-xs text-gray-500 font-semibold mb-1">Altcoins</p>
            <p className="text-2xl font-extrabold text-cyan-400">{altDom.toFixed(1)}%</p>
          </div>
        </div>

        {/* Visual Bar */}
        <div className="bg-[#111827] border border-white/[0.06] rounded-2xl p-6 mb-6">
          <h2 className="text-lg font-bold mb-4">Répartition Visuelle</h2>
          <div className="flex h-10 rounded-xl overflow-hidden">
            {coins.slice(0, 15).map((c) => (
              <div
                key={c.id}
                className="h-full relative group cursor-pointer transition-all hover:brightness-125"
                style={{ width: `${c.dominance}%`, backgroundColor: c.color, minWidth: c.dominance > 0.5 ? "2px" : "0" }}
              >
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-black/90 rounded text-xs font-bold whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-10">
                  {c.symbol} {c.dominance.toFixed(1)}%
                </div>
              </div>
            ))}
          </div>
          <div className="flex flex-wrap gap-3 mt-4">
            {coins.slice(0, 15).map((c) => (
              <div key={c.id} className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: c.color }} />
                <span className="text-xs text-gray-400 font-semibold">{c.symbol} {c.dominance.toFixed(1)}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* Full Table */}
        <div className="bg-[#111827] border border-white/[0.06] rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold">Top 50 — Détails de la Dominance</h2>
            <span className="text-xs text-gray-500">{coins.length} actifs</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px]">
              <thead>
                <tr className="border-b border-white/[0.06]">
                  <th className="text-left py-3 px-3 text-xs font-bold text-gray-500 uppercase">#</th>
                  <th className="text-left py-3 px-3 text-xs font-bold text-gray-500 uppercase">Crypto</th>
                  <th className="text-right py-3 px-3 text-xs font-bold text-gray-500 uppercase">Prix</th>
                  <th className="text-right py-3 px-3 text-xs font-bold text-gray-500 uppercase">24h</th>
                  <th className="text-right py-3 px-3 text-xs font-bold text-gray-500 uppercase">Market Cap</th>
                  <th className="text-right py-3 px-3 text-xs font-bold text-gray-500 uppercase">Volume 24h</th>
                  <th className="text-right py-3 px-3 text-xs font-bold text-gray-500 uppercase">Dominance</th>
                  <th className="text-right py-3 px-3 text-xs font-bold text-gray-500 uppercase">Barre</th>
                </tr>
              </thead>
              <tbody>
                {coins.map((c, i) => (
                  <tr key={c.id} className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors">
                    <td className="py-3 px-3 text-sm text-gray-500 font-semibold">{i + 1}</td>
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-3">
                        {c.image ? (
                          <img src={c.image} alt={c.symbol} className="w-7 h-7 rounded-full" />
                        ) : (
                          <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold" style={{ background: c.color }}>
                            {c.symbol.slice(0, 2)}
                          </div>
                        )}
                        <div>
                          <p className="text-sm font-bold">{c.name}</p>
                          <p className="text-xs text-gray-500">{c.symbol}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-right text-sm font-bold">
                      ${c.price >= 1 ? c.price.toLocaleString("en-US", { maximumFractionDigits: 2 }) : c.price.toFixed(6)}
                    </td>
                    <td className={`py-3 px-3 text-right text-sm font-bold ${c.change24h >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                      <div className="flex items-center justify-end gap-1">
                        {c.change24h >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                        {c.change24h >= 0 ? "+" : ""}{c.change24h.toFixed(2)}%
                      </div>
                    </td>
                    <td className="py-3 px-3 text-right text-sm text-gray-300">{formatNum(c.market_cap)}</td>
                    <td className="py-3 px-3 text-right text-sm text-gray-300">{formatNum(c.volume)}</td>
                    <td className="py-3 px-3 text-right text-sm font-bold" style={{ color: c.color }}>
                      {c.dominance.toFixed(2)}%
                    </td>
                    <td className="py-3 px-3 w-32">
                      <div className="w-full h-2.5 bg-gray-800 rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${Math.min(c.dominance * 2, 100)}%`, background: c.color }} />
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