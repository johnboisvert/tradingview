import { useEffect, useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import Sidebar from "@/components/Sidebar";
import { Activity, RefreshCw, TrendingUp, TrendingDown, Sparkles, Gauge } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import Footer from "@/components/Footer";

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
  const { t } = useTranslation();
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
      <main className="md:ml-[260px] pt-14 md:pt-0 bg-[#0A0E1A]">
      <PageHeader
          icon={<Activity className="w-6 h-6" />}
          title={t("pages.marketRegime.title")}
          subtitle={t("pages.marketRegime.subtitle")}
          accentColor="blue"
          steps={[
            { n: "1", title: t("pages.marketRegime.steps.1.title"), desc: t("pages.marketRegime.steps.1.desc") },
            { n: "2", title: t("pages.marketRegime.steps.2.title"), desc: t("pages.marketRegime.steps.2.desc") },
            { n: "3", title: t("pages.marketRegime.steps.3.title"), desc: t("pages.marketRegime.steps.3.desc") },
          ]}
        />
        {/* ===== HERO (pure CSS) ===== */}
        <div className="relative rounded-3xl overflow-hidden mb-6 border border-white/[0.08]">
          <div className="absolute inset-0 bg-[#0A0E1A]" />
          <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full blur-3xl" style={{ background: dominantRegime?.[0]?.includes("Haussier") ? "rgba(34,197,94,0.22)" : dominantRegime?.[0]?.includes("Baissier") ? "rgba(239,68,68,0.22)" : "rgba(139,92,246,0.22)", animation: "mr-pulse 6s ease-in-out infinite" }} />
          <div className="absolute -bottom-24 right-1/3 w-80 h-80 rounded-full bg-cyan-500/20 blur-3xl" style={{ animation: "mr-pulse 8s ease-in-out infinite reverse" }} />
          <div
            className="absolute inset-0 opacity-[0.04]"
            style={{
              backgroundImage:
                "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
              backgroundSize: "44px 44px",
            }}
          />
          <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4 px-6 md:px-10 py-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center" style={{ boxShadow: "0 0 30px rgba(168,85,247,0.25)" }}>
                <Gauge className="w-7 h-7 text-purple-400" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                  <h1 className="text-xl md:text-2xl font-black bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
                    Market Regime
                  </h1>
                  {dominantRegime && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border" style={{ color: coins.find((c) => c.regime === dominantRegime[0])?.regimeColor || "#a78bfa", borderColor: "rgba(168,85,247,0.4)", background: "rgba(168,85,247,0.08)" }}>
                      <Sparkles className="w-2.5 h-2.5" /> {dominantRegime[0]}
                    </span>
                  )}
                </div>
                <p className="text-xs md:text-sm text-gray-400">Analyse régime de marché • Volatilité • Momentum • Top 200</p>
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
          @keyframes mr-pulse {
            0%, 100% { transform: scale(1) translate(0,0); opacity: 0.25; }
            50% { transform: scale(1.15) translate(15px,-8px); opacity: 0.4; }
          }
          @keyframes mr-fadeUp {
            from { opacity: 0; transform: translateY(12px); }
            to { opacity: 1; transform: translateY(0); }
          }
          .mr-anim { animation: mr-fadeUp 0.6s ease-out both; }
        `}</style>

        {/* Regime Summary */}
        <div className="mr-anim relative bg-gradient-to-br from-white/[0.04] to-white/[0.01] border border-white/[0.08] rounded-3xl p-6 mb-6 overflow-hidden" style={{ animationDelay: "100ms" }}>
          <div className="absolute -top-20 right-1/4 w-72 h-72 rounded-full blur-3xl opacity-20 bg-purple-500" />
          <h2 className="relative text-base md:text-lg font-bold mb-5 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" /> Régime Dominant du Marché
          </h2>
          <div className="relative grid grid-cols-2 md:grid-cols-5 gap-3">
            {Object.entries(regimeCounts).sort((a, b) => b[1] - a[1]).map(([regime, count]) => {
              const isActive = regime === dominantRegime?.[0];
              const color = coins.find((c) => c.regime === regime)?.regimeColor || "#94a3b8";
              const pct = coins.length ? (count / coins.length) * 100 : 0;
              return (
                <div
                  key={regime}
                  className="relative p-4 rounded-2xl border text-center overflow-hidden transition-all"
                  style={{
                    background: isActive ? `${color}12` : "rgba(255,255,255,0.02)",
                    borderColor: isActive ? `${color}55` : "rgba(255,255,255,0.06)",
                    boxShadow: isActive ? `0 0 30px ${color}22, inset 0 0 20px ${color}08` : "none",
                  }}
                >
                  {isActive && (
                    <div className="absolute -top-10 -right-10 w-24 h-24 rounded-full blur-2xl" style={{ background: color, opacity: 0.35 }} />
                  )}
                  <p className="relative text-sm font-bold" style={{ color: isActive ? color : "#cbd5e1" }}>{regime}</p>
                  <p className="relative text-3xl font-black mt-1" style={{ color, textShadow: isActive ? `0 0 16px ${color}55` : "none" }}>{count}</p>
                  <p className="relative text-[10px] text-gray-500 mt-0.5">cryptos · {pct.toFixed(0)}%</p>
                  <div className="relative mt-2 h-1 bg-white/[0.04] rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${pct}%`, background: color, boxShadow: `0 0 8px ${color}66` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          {[
            { label: "Volatilité Moyenne", value: `${avgVol.toFixed(2)}%`, color: "#fbbf24", icon: "⚡", sub: avgVol > 5 ? "Volatilité élevée" : "Modérée" },
            { label: "Régime Dominant", value: dominantRegime?.[0] || "—", color: coins.find((c) => c.regime === dominantRegime?.[0])?.regimeColor || "#a78bfa", icon: "🎯", sub: `${dominantRegime?.[1] || 0} cryptos`, small: true },
            { label: "Cryptos Analysées", value: `${coins.length}`, color: "#22d3ee", icon: "📊", sub: "Top 200 CoinGecko" },
          ].map((k, i) => (
            <div key={i}
              className="mr-anim relative bg-gradient-to-br from-white/[0.04] to-white/[0.01] border border-white/[0.06] hover:border-white/[0.14] rounded-2xl p-5 overflow-hidden transition-all"
              style={{ animationDelay: `${150 + i * 60}ms` }}>
              <div className="absolute -top-12 -right-12 w-32 h-32 rounded-full blur-3xl opacity-20" style={{ background: k.color }} />
              <div className="relative">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[10px] md:text-xs text-gray-500 font-bold uppercase tracking-wider">{k.label}</p>
                  <span className="text-lg">{k.icon}</span>
                </div>
                <p className={`${k.small ? "text-base md:text-lg" : "text-2xl md:text-3xl"} font-black tracking-tight`} style={{ color: k.color, textShadow: `0 0 16px ${k.color}30` }}>
                  {k.value}
                </p>
                <p className="text-[10px] md:text-xs text-gray-500 mt-1">{k.sub}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Details Table */}
        <div className="mr-anim bg-gradient-to-br from-white/[0.04] to-white/[0.01] border border-white/[0.08] rounded-3xl p-6" style={{ animationDelay: "300ms" }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base md:text-lg font-bold flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" /> Détails — Top 200 + Favoris
            </h2>
            <span className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">{coins.length} actifs</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1000px]">
              <thead>
                <tr className="border-b border-white/[0.08]">
                  <th className="text-left py-3 px-3 text-[10px] font-bold text-gray-500 uppercase tracking-wider">#</th>
                  <th className="text-left py-3 px-3 text-[10px] font-bold text-gray-500 uppercase tracking-wider">Crypto</th>
                  <th className="text-right py-3 px-3 text-[10px] font-bold text-gray-500 uppercase tracking-wider">Prix</th>
                  <th className="text-right py-3 px-3 text-[10px] font-bold text-gray-500 uppercase tracking-wider">24h</th>
                  <th className="text-right py-3 px-3 text-[10px] font-bold text-gray-500 uppercase tracking-wider">7j</th>
                  <th className="text-right py-3 px-3 text-[10px] font-bold text-gray-500 uppercase tracking-wider">Volatilité</th>
                  <th className="text-right py-3 px-3 text-[10px] font-bold text-gray-500 uppercase tracking-wider">Volume</th>
                  <th className="text-left py-3 px-3 text-[10px] font-bold text-gray-500 uppercase tracking-wider">Régime</th>
                </tr>
              </thead>
              <tbody>
                {coins.map((c, i) => {
                  const tintOp = Math.min(Math.abs(c.change24h) / 8, 1) * 0.05;
                  return (
                  <tr key={c.id} className="border-b border-white/[0.03] hover:bg-white/[0.04] transition-colors" style={{ background: `${c.regimeColor}${Math.round(tintOp * 255).toString(16).padStart(2, "0")}` }}>
                    <td className="py-3 px-3 text-sm text-gray-500 font-bold">{i + 1}</td>
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-3">
                        {c.image && <img src={c.image} alt={c.symbol} className="w-7 h-7 rounded-full ring-1 ring-white/10" />}
                        <div><p className="text-sm font-bold">{c.symbol}</p><p className="text-[10px] text-gray-500 font-semibold">{c.name}</p></div>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-right text-sm font-bold font-mono">${c.price >= 1 ? c.price.toLocaleString("en-US", { maximumFractionDigits: 2 }) : c.price.toFixed(6)}</td>
                    <td className={`py-3 px-3 text-right text-sm font-bold ${c.change24h >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                      <div className="flex items-center justify-end gap-1">
                        {c.change24h >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                        {c.change24h >= 0 ? "+" : ""}{c.change24h.toFixed(2)}%
                      </div>
                    </td>
                    <td className={`py-3 px-3 text-right text-sm font-bold ${c.change7d >= 0 ? "text-emerald-400" : "text-red-400"}`}>{c.change7d >= 0 ? "+" : ""}{c.change7d.toFixed(2)}%</td>
                    <td className="py-3 px-3 text-right text-sm text-amber-400 font-bold font-mono">{c.volatility}%</td>
                    <td className="py-3 px-3 text-right text-sm text-gray-300 font-mono">{formatNum(c.volume)}</td>
                    <td className="py-3 px-3">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-[10px] font-bold border whitespace-nowrap" style={{ color: c.regimeColor, borderColor: `${c.regimeColor}33`, background: `${c.regimeColor}14` }}>
                        {c.regime}
                      </span>
                    </td>
                  </tr>
                );})}
              </tbody>
            </table>
          </div>
        </div>
        <Footer />
      </main>
    </div>
  );
}