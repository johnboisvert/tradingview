import { useEffect, useState, useCallback } from "react";
import Sidebar from "@/components/Sidebar";
import { Shield, RefreshCw, TrendingUp, TrendingDown, AlertTriangle, Search } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import { fetchTop200, formatPrice, formatMarketCap, type CoinMarketData } from "@/lib/cryptoApi";
import Footer from "@/components/Footer";

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
      <main className="md:ml-[260px] pt-14 md:pt-0 bg-[#0A0E1A]">
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
        {/* ===== HERO premium ===== */}
        <div className="relative rounded-3xl overflow-hidden mb-6 border border-white/[0.08]">
          <div className="absolute inset-0 bg-[#0A0E1A]" />
          <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-emerald-500/22 blur-3xl" style={{ animation: "rm-pulse 6s ease-in-out infinite" }} />
          <div className="absolute -bottom-24 right-1/3 w-80 h-80 rounded-full bg-teal-500/22 blur-3xl" style={{ animation: "rm-pulse 8s ease-in-out infinite reverse" }} />
          <div className="absolute inset-0 opacity-[0.04]" style={{
            backgroundImage: "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
            backgroundSize: "44px 44px",
          }} />
          <div className="relative z-10 flex items-center justify-between gap-4 px-6 md:px-10 py-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/15 border border-emerald-500/40 flex items-center justify-center" style={{ boxShadow: "0 0 30px rgba(34,197,94,0.3)" }}>
                <Shield className="w-7 h-7 text-emerald-300" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <h1 className="text-xl md:text-2xl font-black bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 bg-clip-text text-transparent">
                    Gestion des Risques
                  </h1>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border border-emerald-500/40 bg-emerald-500/10 text-emerald-300">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Risk Analysis
                  </span>
                </div>
                <p className="text-xs md:text-sm text-gray-400">Analyse de risque · Volatilité · Position sizing · Top 200 cryptos</p>
              </div>
            </div>
            <button onClick={fetchData} disabled={loading}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.1] text-sm font-semibold transition-all disabled:opacity-50">
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
              <span className="hidden sm:inline">{lastUpdate ? `MAJ ${lastUpdate}` : "Rafraîchir"}</span>
            </button>
          </div>
        </div>
        <style>{`
          @keyframes rm-pulse {
            0%, 100% { transform: scale(1) translate(0,0); opacity: 0.3; }
            50% { transform: scale(1.2) translate(20px,-10px); opacity: 0.45; }
          }
        `}</style>

        {/* Position Sizer */}
        <div className="relative bg-gradient-to-br from-white/[0.04] to-white/[0.01] border border-white/[0.08] rounded-3xl p-6 mb-6 overflow-hidden">
          <div className="absolute -top-20 right-1/4 w-72 h-72 rounded-full blur-3xl opacity-15 bg-emerald-500" />
          <h2 className="relative text-base md:text-lg font-bold mb-4 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /> 📐 Calculateur de Position
          </h2>
          <div className="relative grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-1.5 block">Capital ($)</label>
              <input type="number" value={capital} onChange={(e) => setCapital(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm text-white focus:outline-none focus:border-emerald-500/50 focus:bg-white/[0.06] transition-all" />
            </div>
            <div>
              <label className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-1.5 block">Risque par Trade (%)</label>
              <input type="number" value={riskPct} onChange={(e) => setRiskPct(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm text-white focus:outline-none focus:border-emerald-500/50 focus:bg-white/[0.06] transition-all" />
            </div>
            <div className="relative bg-gradient-to-br from-amber-500/[0.06] to-transparent rounded-xl p-4 border border-amber-500/20 text-center overflow-hidden">
              <div className="absolute -top-10 -right-10 w-24 h-24 rounded-full bg-amber-500/15 blur-2xl" />
              <p className="relative text-[10px] text-gray-500 mb-1 font-bold uppercase tracking-wider">Risque Max / Trade</p>
              <p className="relative text-2xl font-black text-amber-400" style={{ textShadow: "0 0 14px rgba(251,191,36,0.4)" }}>${riskAmount.toFixed(2)}</p>
            </div>
            <div className="relative bg-gradient-to-br from-red-500/[0.06] to-transparent rounded-xl p-4 border border-red-500/20 text-center overflow-hidden">
              <div className="absolute -top-10 -right-10 w-24 h-24 rounded-full bg-red-500/15 blur-2xl" />
              <p className="relative text-[10px] text-gray-500 mb-1 font-bold uppercase tracking-wider">Trades avant -50%</p>
              <p className="relative text-2xl font-black text-red-400" style={{ textShadow: "0 0 14px rgba(239,68,68,0.4)" }}>{rp > 0 ? Math.ceil(50 / rp) : "∞"}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 md:gap-4 mb-6">
          {[
            { label: "Risque Moyen Marché", value: `${avgRisk.toFixed(0)}/100`, color: avgRisk < 40 ? "#22c55e" : avgRisk < 60 ? "#eab308" : "#ef4444", icon: "🎯" },
            { label: "Cryptos Risquées", value: highRisk, color: "#ef4444", icon: "🔴" },
            { label: "Cryptos Sûres", value: coins.length - highRisk, color: "#22c55e", icon: "🟢" },
            { label: "Analysées", value: coins.length, color: "#22d3ee", icon: "📊" },
          ].map((k, i) => (
            <div key={i} className="relative bg-gradient-to-br from-white/[0.04] to-white/[0.01] border border-white/[0.06] hover:border-white/[0.14] rounded-2xl p-4 md:p-5 overflow-hidden transition-all">
              <div className="absolute -top-12 -right-12 w-32 h-32 rounded-full blur-3xl opacity-25" style={{ background: k.color }} />
              <div className="relative">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">{k.label}</p>
                  <span className="text-base">{k.icon}</span>
                </div>
                <p className="text-2xl md:text-3xl font-black" style={{ color: k.color, textShadow: `0 0 14px ${k.color}40` }}>{k.value}</p>
              </div>
            </div>
          ))}
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
        <Footer />
      </main>
    </div>
  );
}
