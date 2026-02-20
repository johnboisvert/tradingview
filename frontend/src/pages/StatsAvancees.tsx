import { useEffect, useState, useCallback } from "react";
import Sidebar from "@/components/Sidebar";
import { BarChart3, RefreshCw, TrendingUp, TrendingDown, Search } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import { fetchTop200, formatPrice, formatMarketCap, type CoinMarketData } from "@/lib/cryptoApi";
import Footer from "@/components/Footer";

interface StatCoin {
  id: string; symbol: string; name: string; price: number; change24h: number;
  change7d: number; market_cap: number; volume: number; ath: number; athPct: number;
  high24h: number; low24h: number; image: string; volMcRatio: number;
  priceRange: number;
}

function buildStat(c: CoinMarketData): StatCoin {
  const mc = c.market_cap || 1;
  const vol = c.total_volume || 0;
  const h = (c as any).high_24h || 0;
  const l = (c as any).low_24h || 0;
  return {
    id: c.id,
    symbol: c.symbol.toUpperCase(),
    name: c.name,
    price: c.current_price || 0,
    change24h: c.price_change_percentage_24h || 0,
    change7d: c.price_change_percentage_7d_in_currency || 0,
    market_cap: mc, volume: vol,
    ath: (c as any).ath || 0,
    athPct: (c as any).ath_change_percentage || 0,
    high24h: h, low24h: l,
    image: c.image,
    volMcRatio: mc > 0 ? Math.round((vol / mc) * 10000) / 100 : 0,
    priceRange: l > 0 ? Math.round(((h - l) / l) * 10000) / 100 : 0,
  };
}

export default function StatsAvancees() {
  const [coins, setCoins] = useState<StatCoin[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState("");
  const [search, setSearch] = useState("");

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchTop200(false);
      setCoins(data.map(buildStat));
      setLastUpdate(new Date().toLocaleTimeString("fr-FR"));
    } catch { /* keep */ } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); const i = setInterval(fetchData, 120000); return () => clearInterval(i); }, [fetchData]);

  const filtered = search
    ? coins.filter((c) => c.symbol.includes(search.toUpperCase()) || c.name.toLowerCase().includes(search.toLowerCase()))
    : coins;

  const totalMC = coins.reduce((s, c) => s + c.market_cap, 0);
  const totalVol = coins.reduce((s, c) => s + c.volume, 0);
  const avgVolMC = coins.length ? coins.reduce((s, c) => s + c.volMcRatio, 0) / coins.length : 0;
  const avgRange = coins.length ? coins.reduce((s, c) => s + c.priceRange, 0) / coins.length : 0;

  return (
    <div className="min-h-screen bg-[#0A0E1A] text-white">
      <Sidebar />
      <main className="ml-[260px] bg-[#0A0E1A]">
      <PageHeader
          icon={<BarChart3 className="w-6 h-6" />}
          title="Statistiques Avancées"
          subtitle="Plongez dans les statistiques détaillées du marché crypto : corrélations, volatilité historique, distribution des rendements et métriques de risque avancées."
          accentColor="cyan"
          steps={[
            { n: "1", title: "Explorez les statistiques", desc: "Consultez les métriques avancées de chaque crypto : volatilité, Sharpe ratio, drawdown maximum et distribution des rendements." },
            { n: "2", title: "Analysez les corrélations", desc: "La matrice de corrélation montre quels actifs bougent ensemble. Utile pour diversifier votre portefeuille efficacement." },
            { n: "3", title: "Comparez les actifs", desc: "Utilisez les statistiques pour comparer objectivement les cryptos et identifier celles avec le meilleur ratio rendement/risque." },
          ]}
        />
        <div className="relative rounded-2xl overflow-hidden mb-6 h-[120px] bg-gradient-to-r from-cyan-900/40 to-blue-900/40">
          <div className="absolute inset-0 bg-gradient-to-r from-[#0A0E1A]/90 via-[#0A0E1A]/60 to-transparent" />
          <div className="relative z-10 h-full flex items-center justify-between px-8">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <BarChart3 className="w-7 h-7 text-cyan-400" />
                <h1 className="text-2xl font-extrabold">Statistiques Avancées</h1>
              </div>
              <p className="text-sm text-gray-400">Métriques avancées • Vol/MC ratio • Range • ATH distance • Top 200</p>
            </div>
            <button onClick={fetchData} disabled={loading}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/[0.08] hover:bg-white/[0.12] border border-white/[0.08] text-sm font-semibold transition-all">
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
              {lastUpdate ? `MAJ ${lastUpdate}` : "Rafraîchir"}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
          <div className="bg-[#111827] border border-white/[0.06] rounded-2xl p-5">
            <p className="text-xs text-gray-500 font-semibold mb-1">Market Cap Total</p>
            <p className="text-2xl font-extrabold">{formatMarketCap(totalMC)}</p>
          </div>
          <div className="bg-[#111827] border border-white/[0.06] rounded-2xl p-5">
            <p className="text-xs text-gray-500 font-semibold mb-1">Volume Total 24h</p>
            <p className="text-2xl font-extrabold text-cyan-400">{formatMarketCap(totalVol)}</p>
          </div>
          <div className="bg-[#111827] border border-white/[0.06] rounded-2xl p-5">
            <p className="text-xs text-gray-500 font-semibold mb-1">Ratio Vol/MC Moyen</p>
            <p className="text-2xl font-extrabold text-amber-400">{avgVolMC.toFixed(2)}%</p>
          </div>
          <div className="bg-[#111827] border border-white/[0.06] rounded-2xl p-5">
            <p className="text-xs text-gray-500 font-semibold mb-1">Range 24h Moyen</p>
            <p className="text-2xl font-extrabold text-purple-400">{avgRange.toFixed(2)}%</p>
          </div>
        </div>

        <div className="bg-[#111827] border border-white/[0.06] rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
            <h2 className="text-lg font-bold">📊 Métriques Avancées — Top 200</h2>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher..."
                className="pl-9 pr-3 py-2 rounded-lg bg-black/30 border border-white/[0.08] text-sm text-white placeholder-gray-500 focus:outline-none w-48" />
            </div>
          </div>
          <div className="overflow-x-auto max-h-[700px] overflow-y-auto">
            <table className="w-full min-w-[1200px]">
              <thead className="sticky top-0 bg-[#111827] z-10">
                <tr className="border-b border-white/[0.06]">
                  <th className="text-left py-3 px-3 text-xs font-bold text-gray-500 uppercase">#</th>
                  <th className="text-left py-3 px-3 text-xs font-bold text-gray-500 uppercase">Crypto</th>
                  <th className="text-right py-3 px-3 text-xs font-bold text-gray-500 uppercase">Prix</th>
                  <th className="text-right py-3 px-3 text-xs font-bold text-gray-500 uppercase">24h</th>
                  <th className="text-right py-3 px-3 text-xs font-bold text-gray-500 uppercase">7j</th>
                  <th className="text-right py-3 px-3 text-xs font-bold text-gray-500 uppercase">Market Cap</th>
                  <th className="text-right py-3 px-3 text-xs font-bold text-gray-500 uppercase">Volume</th>
                  <th className="text-right py-3 px-3 text-xs font-bold text-gray-500 uppercase">Vol/MC</th>
                  <th className="text-right py-3 px-3 text-xs font-bold text-gray-500 uppercase">Range 24h</th>
                  <th className="text-right py-3 px-3 text-xs font-bold text-gray-500 uppercase">vs ATH</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c, i) => (
                  <tr key={c.id} className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors">
                    <td className="py-2.5 px-3 text-sm text-gray-500">{i + 1}</td>
                    <td className="py-2.5 px-3">
                      <div className="flex items-center gap-2">
                        {c.image && <img src={c.image} alt={c.symbol} className="w-6 h-6 rounded-full" />}
                        <div><p className="text-sm font-bold">{c.symbol}</p><p className="text-[10px] text-gray-500">{c.name}</p></div>
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-right text-sm font-bold">${formatPrice(c.price)}</td>
                    <td className={`py-2.5 px-3 text-right text-sm font-bold ${c.change24h >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                      <div className="flex items-center justify-end gap-1">
                        {c.change24h >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                        {c.change24h >= 0 ? "+" : ""}{c.change24h.toFixed(2)}%
                      </div>
                    </td>
                    <td className={`py-2.5 px-3 text-right text-sm font-bold ${c.change7d >= 0 ? "text-emerald-400" : "text-red-400"}`}>{c.change7d >= 0 ? "+" : ""}{c.change7d.toFixed(2)}%</td>
                    <td className="py-2.5 px-3 text-right text-sm text-gray-300">{formatMarketCap(c.market_cap)}</td>
                    <td className="py-2.5 px-3 text-right text-sm text-gray-300">{formatMarketCap(c.volume)}</td>
                    <td className={`py-2.5 px-3 text-right text-sm font-bold ${c.volMcRatio > 15 ? "text-cyan-400" : c.volMcRatio > 5 ? "text-amber-400" : "text-gray-400"}`}>{c.volMcRatio.toFixed(2)}%</td>
                    <td className="py-2.5 px-3 text-right text-sm text-purple-400 font-bold">{c.priceRange.toFixed(2)}%</td>
                    <td className={`py-2.5 px-3 text-right text-sm font-bold ${c.athPct > -10 ? "text-emerald-400" : c.athPct > -50 ? "text-amber-400" : "text-red-400"}`}>{c.athPct.toFixed(1)}%</td>
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