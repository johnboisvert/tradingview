import { useEffect, useState, useCallback } from "react";
import Sidebar from "@/components/Sidebar";
import { Shield, RefreshCw, TrendingUp, TrendingDown, AlertTriangle, Search } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import { fetchTop200, formatPrice, formatMarketCap, type CoinMarketData } from "@/lib/cryptoApi";

interface RiskCoin extends CoinMarketData {
  volatility: number; riskScore: number; riskLevel: string; riskColor: string;
}

function computeRisk(c: CoinMarketData): RiskCoin {
  const ch24 = Math.abs(c.price_change_percentage_24h || 0);
  const ch7d = Math.abs(c.price_change_percentage_7d_in_currency || 0);
  const mc = c.market_cap || 1;
  const vol = c.total_volume || 0;
  const volatility = Math.round((ch24 * 0.6 + ch7d * 0.4 / 7) * 100) / 100;
  const mcFactor = mc > 100e9 ? 0 : mc > 10e9 ? 10 : mc > 1e9 ? 25 : 40;
  const volFactor = vol / mc > 0.3 ? 15 : vol / mc > 0.1 ? 5 : 0;
  const riskScore = Math.min(100, Math.round(volatility * 5 + mcFactor + volFactor));
  const riskLevel = riskScore < 25 ? "Faible" : riskScore < 50 ? "Modéré" : riskScore < 75 ? "Élevé" : "Très Élevé";
  const riskColor = riskScore < 25 ? "#22c55e" : riskScore < 50 ? "#eab308" : riskScore < 75 ? "#f97316" : "#ef4444";
  return { ...c, volatility, riskScore, riskLevel, riskColor };
}

export default function RiskManagement() {
  const [coins, setCoins] = useState<RiskCoin[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState("");
  const [capital, setCapital] = useState("10000");
  const [riskPct, setRiskPct] = useState("2");
  const [search, setSearch] = useState("");

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchTop200(false);
      setCoins(data.map(computeRisk));
      setLastUpdate(new Date().toLocaleTimeString("fr-FR"));
    } catch { /* keep */ } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); const i = setInterval(fetchData, 120000); return () => clearInterval(i); }, [fetchData]);

  const cap = parseFloat(capital) || 0;
  const rp = parseFloat(riskPct) || 0;
  const riskAmount = cap * (rp / 100);
  const avgRisk = coins.length ? coins.reduce((s, c) => s + c.riskScore, 0) / coins.length : 0;
  const highRisk = coins.filter((c) => c.riskScore >= 50).length;

  const filtered = search
    ? coins.filter((c) => c.symbol.toUpperCase().includes(search.toUpperCase()) || c.name.toLowerCase().includes(search.toLowerCase()))
    : coins;

  return (
    <div className="min-h-screen bg-[#0A0E1A] text-white">
      <Sidebar />
      <main className="ml-[260px]">
      <PageHeader
          icon={<Shield className="w-6 h-6" />}
          title="Gestion des Risques"
          subtitle="Maîtrisez votre exposition au risque. Calculez vos stop loss optimaux, gérez votre capital et protégez votre portefeuille contre les mouvements adverses du marché."
          accentColor="red"
          steps={[
            { n: "1", title: "Définissez votre risque", desc: "Entrez votre capital total et le pourcentage maximum que vous acceptez de risquer par trade (règle d'or : max 1-2%)." },
            { n: "2", title: "Calculez vos stops", desc: "L'outil calcule automatiquement le stop loss optimal basé sur la volatilité de l'actif et votre tolérance au risque." },
            { n: "3", title: "Surveillez l'exposition", desc: "Vérifiez régulièrement votre exposition totale. Ne jamais avoir plus de 10-15% de votre capital en risque simultanément." },
          ]}
        />
        <div className="relative rounded-2xl overflow-hidden mb-6 h-[120px] bg-gradient-to-r from-emerald-900/40 to-teal-900/40">
          <div className="absolute inset-0 bg-gradient-to-r from-[#0A0E1A]/90 via-[#0A0E1A]/60 to-transparent" />
          <div className="relative z-10 h-full flex items-center justify-between px-8">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <Shield className="w-7 h-7 text-emerald-400" />
                <h1 className="text-2xl font-extrabold">Gestion des Risques</h1>
              </div>
              <p className="text-sm text-gray-400">Analyse de risque • Volatilité • Position sizing • Top 200 cryptos</p>
            </div>
            <button onClick={fetchData} disabled={loading}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/[0.08] hover:bg-white/[0.12] border border-white/[0.08] text-sm font-semibold transition-all">
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
              {lastUpdate ? `MAJ ${lastUpdate}` : "Rafraîchir"}
            </button>
          </div>
        </div>

        {/* Position Sizer */}
        <div className="bg-[#111827] border border-white/[0.06] rounded-2xl p-6 mb-6">
          <h2 className="text-lg font-bold mb-4">📐 Calculateur de Position</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-xs text-gray-500 font-semibold mb-1 block">Capital ($)</label>
              <input type="number" value={capital} onChange={(e) => setCapital(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-black/30 border border-white/[0.08] text-sm text-white focus:outline-none" />
            </div>
            <div>
              <label className="text-xs text-gray-500 font-semibold mb-1 block">Risque par Trade (%)</label>
              <input type="number" value={riskPct} onChange={(e) => setRiskPct(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-black/30 border border-white/[0.08] text-sm text-white focus:outline-none" />
            </div>
            <div className="bg-black/20 rounded-xl p-4 border border-white/[0.04] text-center">
              <p className="text-xs text-gray-500 mb-1">Risque Max par Trade</p>
              <p className="text-2xl font-extrabold text-amber-400">${riskAmount.toFixed(2)}</p>
            </div>
            <div className="bg-black/20 rounded-xl p-4 border border-white/[0.04] text-center">
              <p className="text-xs text-gray-500 mb-1">Trades avant -50%</p>
              <p className="text-2xl font-extrabold text-red-400">{rp > 0 ? Math.ceil(50 / rp) : "∞"}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
          <div className="bg-[#111827] border border-white/[0.06] rounded-2xl p-5">
            <p className="text-xs text-gray-500 font-semibold mb-1">Risque Moyen Marché</p>
            <p className="text-2xl font-extrabold" style={{ color: avgRisk < 40 ? "#22c55e" : avgRisk < 60 ? "#eab308" : "#ef4444" }}>{avgRisk.toFixed(0)}/100</p>
          </div>
          <div className="bg-[#111827] border border-white/[0.06] rounded-2xl p-5">
            <p className="text-xs text-gray-500 font-semibold mb-1">Cryptos Risquées</p>
            <p className="text-2xl font-extrabold text-red-400">{highRisk}</p>
          </div>
          <div className="bg-[#111827] border border-white/[0.06] rounded-2xl p-5">
            <p className="text-xs text-gray-500 font-semibold mb-1">Cryptos Sûres</p>
            <p className="text-2xl font-extrabold text-emerald-400">{coins.length - highRisk}</p>
          </div>
          <div className="bg-[#111827] border border-white/[0.06] rounded-2xl p-5">
            <p className="text-xs text-gray-500 font-semibold mb-1">Analysées</p>
            <p className="text-2xl font-extrabold">{coins.length}</p>
          </div>
        </div>

        <div className="bg-[#111827] border border-white/[0.06] rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
            <h2 className="text-lg font-bold">🛡️ Analyse de Risque — Top 200</h2>
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher..."
                  className="pl-9 pr-3 py-2 rounded-lg bg-black/30 border border-white/[0.08] text-sm text-white placeholder-gray-500 focus:outline-none w-48" />
              </div>
              <div className="flex items-center gap-1 text-xs text-amber-400">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span className="font-bold">Pas un conseil financier</span>
              </div>
            </div>
          </div>
          <div className="overflow-x-auto max-h-[700px] overflow-y-auto">
            <table className="w-full min-w-[1000px]">
              <thead className="sticky top-0 bg-[#111827] z-10">
                <tr className="border-b border-white/[0.06]">
                  <th className="text-left py-3 px-3 text-xs font-bold text-gray-500 uppercase">#</th>
                  <th className="text-left py-3 px-3 text-xs font-bold text-gray-500 uppercase">Crypto</th>
                  <th className="text-right py-3 px-3 text-xs font-bold text-gray-500 uppercase">Prix</th>
                  <th className="text-right py-3 px-3 text-xs font-bold text-gray-500 uppercase">24h</th>
                  <th className="text-right py-3 px-3 text-xs font-bold text-gray-500 uppercase">Volatilité</th>
                  <th className="text-right py-3 px-3 text-xs font-bold text-gray-500 uppercase">Market Cap</th>
                  <th className="text-center py-3 px-3 text-xs font-bold text-gray-500 uppercase">Score Risque</th>
                  <th className="text-center py-3 px-3 text-xs font-bold text-gray-500 uppercase">Niveau</th>
                  <th className="text-right py-3 px-3 text-xs font-bold text-gray-500 uppercase">Position Max</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c, i) => {
                  const maxPos = c.volatility > 0 ? riskAmount / (c.volatility / 100) : 0;
                  return (
                    <tr key={c.id} className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors">
                      <td className="py-2.5 px-3 text-sm text-gray-500">{i + 1}</td>
                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-2">
                          {c.image && <img src={c.image} alt={c.symbol} className="w-6 h-6 rounded-full" />}
                          <div><p className="text-sm font-bold">{c.symbol.toUpperCase()}</p><p className="text-[10px] text-gray-500">{c.name}</p></div>
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-right text-sm font-bold">${formatPrice(c.current_price)}</td>
                      <td className={`py-2.5 px-3 text-right text-sm font-bold ${(c.price_change_percentage_24h || 0) >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                        <div className="flex items-center justify-end gap-1">
                          {(c.price_change_percentage_24h || 0) >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                          {(c.price_change_percentage_24h || 0) >= 0 ? "+" : ""}{(c.price_change_percentage_24h || 0).toFixed(2)}%
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-right text-sm text-amber-400 font-bold">{c.volatility}%</td>
                      <td className="py-2.5 px-3 text-right text-sm text-gray-300">{formatMarketCap(c.market_cap)}</td>
                      <td className="py-2.5 px-3 text-center">
                        <div className="flex items-center gap-2 justify-center">
                          <div className="h-2 w-14 bg-white/[0.06] rounded-full overflow-hidden">
                            <div className="h-full rounded-full" style={{ width: `${c.riskScore}%`, backgroundColor: c.riskColor }} />
                          </div>
                          <span className="text-xs font-bold" style={{ color: c.riskColor }}>{c.riskScore}</span>
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span className="px-2 py-1 rounded-full text-xs font-bold" style={{ backgroundColor: c.riskColor + "20", color: c.riskColor }}>
                          {c.riskLevel}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right text-sm font-bold text-cyan-400">
                        ${maxPos >= 1 ? maxPos.toLocaleString("en-US", { maximumFractionDigits: 0 }) : maxPos.toFixed(2)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}