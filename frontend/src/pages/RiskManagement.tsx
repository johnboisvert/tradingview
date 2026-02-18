import { useEffect, useState, useCallback } from "react";
import Sidebar from "@/components/Sidebar";
import { Shield, RefreshCw, TrendingUp, TrendingDown, AlertTriangle } from "lucide-react";

const RISK_BG =
  "https://mgx-backend-cdn.metadl.com/generate/images/966405/2026-02-18/6e7996e5-3fd7-4958-9f83-5d5f09ef989f.png";

interface RiskCoin {
  id: string; symbol: string; name: string; price: number; change24h: number;
  change7d: number; volume: number; market_cap: number; image: string;
  volatility: number; riskScore: number; riskLevel: string; riskColor: string;
}

function formatNum(n: number): string {
  if (n >= 1e12) return `$${(n / 1e12).toFixed(2)}T`;
  if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
  return `$${n.toFixed(0)}`;
}

export default function RiskManagement() {
  const [coins, setCoins] = useState<RiskCoin[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState("");
  const [capital, setCapital] = useState("10000");
  const [riskPct, setRiskPct] = useState("2");

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(
        "https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=50&page=1&sparkline=false&price_change_percentage=24h,7d"
      );
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setCoins(data.map((c: Record<string, unknown>) => {
            const ch24 = Math.abs((c.price_change_percentage_24h as number) || 0);
            const ch7d = Math.abs((c.price_change_percentage_7d_in_currency as number) || 0);
            const mc = (c.market_cap as number) || 1;
            const vol = (c.total_volume as number) || 0;
            const volatility = Math.round((ch24 * 0.6 + ch7d * 0.4 / 7) * 100) / 100;
            const mcFactor = mc > 100e9 ? 0 : mc > 10e9 ? 10 : mc > 1e9 ? 25 : 40;
            const volFactor = vol / mc > 0.3 ? 15 : vol / mc > 0.1 ? 5 : 0;
            const riskScore = Math.min(100, Math.round(volatility * 5 + mcFactor + volFactor));
            const riskLevel = riskScore < 25 ? "Faible" : riskScore < 50 ? "Modéré" : riskScore < 75 ? "Élevé" : "Très Élevé";
            const riskColor = riskScore < 25 ? "#22c55e" : riskScore < 50 ? "#eab308" : riskScore < 75 ? "#f97316" : "#ef4444";
            return {
              id: c.id as string,
              symbol: ((c.symbol as string) || "").toUpperCase(),
              name: c.name as string,
              price: (c.current_price as number) || 0,
              change24h: (c.price_change_percentage_24h as number) || 0,
              change7d: (c.price_change_percentage_7d_in_currency as number) || 0,
              volume: vol, market_cap: mc, image: c.image as string,
              volatility, riskScore, riskLevel, riskColor,
            };
          }));
        }
      }
      setLastUpdate(new Date().toLocaleTimeString("fr-FR"));
    } catch { /* keep */ } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); const i = setInterval(fetchData, 60000); return () => clearInterval(i); }, [fetchData]);

  const cap = parseFloat(capital) || 0;
  const rp = parseFloat(riskPct) || 0;
  const riskAmount = cap * (rp / 100);
  const avgRisk = coins.length ? coins.reduce((s, c) => s + c.riskScore, 0) / coins.length : 0;
  const highRisk = coins.filter((c) => c.riskScore >= 50).length;

  return (
    <div className="min-h-screen bg-[#0A0E1A] text-white">
      <Sidebar />
      <main className="ml-[260px] p-6 min-h-screen">
        <div className="relative rounded-2xl overflow-hidden mb-6 h-[140px]">
          <img src={RISK_BG} alt="" className="absolute inset-0 w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0A0E1A]/95 via-[#0A0E1A]/75 to-transparent" />
          <div className="relative z-10 h-full flex items-center justify-between px-8">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <Shield className="w-7 h-7 text-emerald-400" />
                <h1 className="text-2xl font-extrabold">Gestion des Risques</h1>
              </div>
              <p className="text-sm text-gray-400">Analyse de risque • Volatilité • Position sizing • Top 50 cryptos</p>
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
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold">🛡️ Analyse de Risque — Top 50</h2>
            <div className="flex items-center gap-1 text-xs text-amber-400">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span className="font-bold">Ne constitue pas un conseil financier</span>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1000px]">
              <thead>
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
                {coins.map((c, i) => {
                  const maxPos = c.volatility > 0 ? riskAmount / (c.volatility / 100) : 0;
                  return (
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
                      <td className="py-3 px-3 text-right text-sm text-amber-400 font-bold">{c.volatility}%</td>
                      <td className="py-3 px-3 text-right text-sm text-gray-300">{formatNum(c.market_cap)}</td>
                      <td className="py-3 px-3 text-center">
                        <div className="flex items-center gap-2 justify-center">
                          <div className="h-2 w-14 bg-white/[0.06] rounded-full overflow-hidden">
                            <div className="h-full rounded-full" style={{ width: `${c.riskScore}%`, backgroundColor: c.riskColor }} />
                          </div>
                          <span className="text-xs font-bold" style={{ color: c.riskColor }}>{c.riskScore}</span>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className="px-2 py-1 rounded-full text-xs font-bold" style={{ backgroundColor: c.riskColor + "20", color: c.riskColor }}>
                          {c.riskLevel}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right text-sm font-bold text-cyan-400">
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