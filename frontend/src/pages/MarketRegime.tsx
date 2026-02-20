import { useEffect, useState, useCallback } from "react";
import Sidebar from "@/components/Sidebar";
import { Activity, RefreshCw, TrendingUp, TrendingDown } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import Footer from "@/components/Footer";

const MR_BG =
  "https://mgx-backend-cdn.metadl.com/generate/images/966405/2026-02-18/b3c0b3a0-ae42-46d0-9f3a-9f12780c9e10.png";

interface RegimeCoin {
  id: string; symbol: string; name: string; price: number; change24h: number;
  change7d: number; volume: number; market_cap: number; image: string;
  volatility: number; regime: string; regimeColor: string;
}

function formatNum(n: number): string {
  if (n >= 1e12) return `$${(n / 1e12).toFixed(2)}T`;
  if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
  return `$${n.toFixed(0)}`;
}

function getRegime(ch24: number, ch7d: number, volRatio: number): { label: string; color: string } {
  const momentum = ch24 * 0.6 + ch7d * 0.4;
  if (momentum > 5 && volRatio > 0.15) return { label: "🚀 Breakout Haussier", color: "#22c55e" };
  if (momentum > 2) return { label: "📈 Tendance Haussière", color: "#84cc16" };
  if (momentum > -2) return { label: "➡️ Range / Consolidation", color: "#94a3b8" };
  if (momentum > -5) return { label: "📉 Tendance Baissière", color: "#f97316" };
  return { label: "💥 Breakout Baissier", color: "#ef4444" };
}

export default function MarketRegime() {
  const [coins, setCoins] = useState<RegimeCoin[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState("");

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const { fetchTop200 } = await import("@/lib/cryptoApi");
      const allData = await fetchTop200(false);
      if (allData.length > 0) {
        const data = allData as any[];
          setCoins(data.map((c: any) => {
            const ch24 = (c.price_change_percentage_24h as number) || 0;
            const ch7d = (c.price_change_percentage_7d_in_currency as number) || 0;
            const vol = (c.total_volume as number) || 0;
            const mc = (c.market_cap as number) || 1;
            const volRatio = vol / mc;
            const regime = getRegime(ch24, ch7d, volRatio);
            return {
              id: c.id as string,
              symbol: ((c.symbol as string) || "").toUpperCase(),
              name: c.name as string,
              price: (c.current_price as number) || 0,
              change24h: ch24, change7d: ch7d,
              volume: vol, market_cap: mc,
              image: c.image as string,
              volatility: Math.round(Math.abs(ch24) * 100) / 100,
              regime: regime.label, regimeColor: regime.color,
            };
          }));
      }
      setLastUpdate(new Date().toLocaleTimeString("fr-FR"));
    } catch { /* keep */ } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); const i = setInterval(fetchData, 60000); return () => clearInterval(i); }, [fetchData]);

  const regimeCounts: Record<string, number> = {};
  coins.forEach((c) => { regimeCounts[c.regime] = (regimeCounts[c.regime] || 0) + 1; });
  const dominantRegime = Object.entries(regimeCounts).sort((a, b) => b[1] - a[1])[0];
  const avgVol = coins.length ? coins.reduce((s, c) => s + c.volatility, 0) / coins.length : 0;

  return (
    <div className="min-h-screen bg-[#0A0E1A] text-white">
      <Sidebar />
      <main className="ml-[260px]">
      <PageHeader
          icon={<Activity className="w-6 h-6" />}
          title="Market Regime"
          subtitle="Identifiez le régime de marché actuel : tendance haussière, baissière, range ou volatilité extrême. Adaptez votre stratégie au contexte de marché pour maximiser vos performances."
          accentColor="blue"
          steps={[
            { n: "1", title: "Identifiez le régime", desc: "Le régime actuel (Bull, Bear, Range, Volatile) détermine quelle stratégie est la plus efficace. Adaptez votre approche en conséquence." },
            { n: "2", title: "Analysez les indicateurs", desc: "Chaque crypto affiche son régime individuel. Cherchez les cryptos en tendance forte pour les stratégies de suivi de tendance." },
            { n: "3", title: "Changez de stratégie", desc: "Trend Following en tendance, Mean Reversion en range, réduction d'exposition en volatilité extrême. Le régime dicte la stratégie." },
          ]}
        />
        <div className="relative rounded-2xl overflow-hidden mb-6 h-[140px]">
          <img src={MR_BG} alt="" className="absolute inset-0 w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0A0E1A]/95 via-[#0A0E1A]/75 to-transparent" />
          <div className="relative z-10 h-full flex items-center justify-between px-8">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <Activity className="w-7 h-7 text-purple-400" />
                <h1 className="text-2xl font-extrabold">Market Regime</h1>
              </div>
              <p className="text-sm text-gray-400">Analyse du régime de marché • Volatilité • Momentum • Top 50</p>
            </div>
            <button onClick={fetchData} disabled={loading}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/[0.08] hover:bg-white/[0.12] border border-white/[0.08] text-sm font-semibold transition-all">
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
              {lastUpdate ? `MAJ ${lastUpdate}` : "Rafraîchir"}
            </button>
          </div>
        </div>

        {/* Regime Summary */}
        <div className="bg-[#111827] border border-white/[0.06] rounded-2xl p-6 mb-6">
          <h2 className="text-lg font-bold mb-4">Régime Dominant du Marché</h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {Object.entries(regimeCounts).sort((a, b) => b[1] - a[1]).map(([regime, count]) => (
              <div key={regime} className={`p-4 rounded-xl border text-center ${regime === dominantRegime?.[0] ? "border-white/[0.15] bg-white/[0.05]" : "border-white/[0.04] bg-black/20"}`}>
                <p className="text-sm font-bold">{regime}</p>
                <p className="text-2xl font-extrabold mt-1">{count}</p>
                <p className="text-xs text-gray-500">cryptos</p>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="bg-[#111827] border border-white/[0.06] rounded-2xl p-5">
            <p className="text-xs text-gray-500 font-semibold mb-1">Volatilité Moyenne</p>
            <p className="text-2xl font-extrabold text-amber-400">{avgVol.toFixed(2)}%</p>
          </div>
          <div className="bg-[#111827] border border-white/[0.06] rounded-2xl p-5">
            <p className="text-xs text-gray-500 font-semibold mb-1">Régime Dominant</p>
            <p className="text-lg font-extrabold">{dominantRegime?.[0] || "—"}</p>
          </div>
          <div className="bg-[#111827] border border-white/[0.06] rounded-2xl p-5">
            <p className="text-xs text-gray-500 font-semibold mb-1">Cryptos Analysées</p>
            <p className="text-2xl font-extrabold">{coins.length}</p>
          </div>
        </div>

        <div className="bg-[#111827] border border-white/[0.06] rounded-2xl p-6">
          <h2 className="text-lg font-bold mb-4">📊 Détails — Top 50</h2>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1000px]">
              <thead>
                <tr className="border-b border-white/[0.06]">
                  <th className="text-left py-3 px-3 text-xs font-bold text-gray-500 uppercase">#</th>
                  <th className="text-left py-3 px-3 text-xs font-bold text-gray-500 uppercase">Crypto</th>
                  <th className="text-right py-3 px-3 text-xs font-bold text-gray-500 uppercase">Prix</th>
                  <th className="text-right py-3 px-3 text-xs font-bold text-gray-500 uppercase">24h</th>
                  <th className="text-right py-3 px-3 text-xs font-bold text-gray-500 uppercase">7j</th>
                  <th className="text-right py-3 px-3 text-xs font-bold text-gray-500 uppercase">Volatilité</th>
                  <th className="text-right py-3 px-3 text-xs font-bold text-gray-500 uppercase">Volume</th>
                  <th className="text-left py-3 px-3 text-xs font-bold text-gray-500 uppercase">Régime</th>
                </tr>
              </thead>
              <tbody>
                {coins.map((c, i) => (
                  <tr key={c.id} className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors">
                    <td className="py-3 px-3 text-sm text-gray-500">{i + 1}</td>
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-3">
                        {c.image && <img src={c.image} alt={c.symbol} className="w-7 h-7 rounded-full" />}
                        <div><p className="text-sm font-bold">{c.symbol}</p><p className="text-[10px] text-gray-500">{c.name}</p></div>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-right text-sm font-bold">${c.price >= 1 ? c.price.toLocaleString("en-US", { maximumFractionDigits: 2 }) : c.price.toFixed(6)}</td>
                    <td className={`py-3 px-3 text-right text-sm font-bold ${c.change24h >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                      <div className="flex items-center justify-end gap-1">
                        {c.change24h >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                        {c.change24h >= 0 ? "+" : ""}{c.change24h.toFixed(2)}%
                      </div>
                    </td>
                    <td className={`py-3 px-3 text-right text-sm font-bold ${c.change7d >= 0 ? "text-emerald-400" : "text-red-400"}`}>{c.change7d >= 0 ? "+" : ""}{c.change7d.toFixed(2)}%</td>
                    <td className="py-3 px-3 text-right text-sm text-amber-400 font-bold">{c.volatility}%</td>
                    <td className="py-3 px-3 text-right text-sm text-gray-300">{formatNum(c.volume)}</td>
                    <td className="py-3 px-3 text-sm font-bold" style={{ color: c.regimeColor }}>{c.regime}</td>
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