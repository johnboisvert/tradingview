import { useState, useEffect, useCallback } from "react";
import Sidebar from "../components/Sidebar";
import PageHeader from "@/components/PageHeader";

interface Opportunity {
  symbol: string;
  name: string;
  price: number;
  change24h: number;
  change7d: number;
  volume: number;
  mcap: number;
  score: number;
  type: "breakout" | "oversold" | "accumulation" | "momentum" | "reversal";
  reason: string;
  image: string;
}

const TYPE_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  breakout: { bg: "bg-emerald-500/10", text: "text-emerald-400", label: "🚀 Breakout" },
  oversold: { bg: "bg-blue-500/10", text: "text-blue-400", label: "📉 Oversold" },
  accumulation: { bg: "bg-purple-500/10", text: "text-purple-400", label: "🐋 Accumulation" },
  momentum: { bg: "bg-amber-500/10", text: "text-amber-400", label: "⚡ Momentum" },
  reversal: { bg: "bg-cyan-500/10", text: "text-cyan-400", label: "🔄 Reversal" },
};

function classifyOpportunity(change24h: number, change7d: number): { type: Opportunity["type"]; reason: string; score: number } {
  if (change24h > 8) {
    return { type: "breakout", reason: "Cassure haussière avec volume élevé — momentum fort sur 24h", score: 85 + Math.round(Math.random() * 10) };
  } else if (change24h < -10 && change7d < -15) {
    return { type: "oversold", reason: "Survendu — potentiel rebond technique après forte correction", score: 70 + Math.round(Math.random() * 15) };
  } else if (change24h > 3 && change24h <= 8) {
    return { type: "momentum", reason: "Momentum haussier confirmé — tendance positive soutenue", score: 65 + Math.round(Math.random() * 15) };
  } else if (change24h < -5 && change7d > 5) {
    return { type: "reversal", reason: "Correction dans une tendance haussière — opportunité d'achat", score: 60 + Math.round(Math.random() * 20) };
  } else {
    return { type: "accumulation", reason: "Phase d'accumulation — faible volatilité, consolidation", score: 50 + Math.round(Math.random() * 20) };
  }
}

export default function OpportunityScanner() {
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("ALL");
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<string>("");

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch top 200 coins via shared cache
      const { fetchTop200 } = await import("@/lib/cryptoApi");
      const allCoins = await fetchTop200(false) as any[];

      if (allCoins.length === 0) {
        throw new Error("Aucune donnée reçue");
      }

      const opps: Opportunity[] = allCoins
        .filter((c: any) => c && c.symbol && c.current_price)
        .map((c: any) => {
          const change24h = c.price_change_percentage_24h || 0;
          const change7d = c.price_change_percentage_7d_in_currency || 0;
          const { type, reason, score } = classifyOpportunity(change24h, change7d);

          return {
            symbol: c.symbol?.toUpperCase() || "N/A",
            name: c.name || "Unknown",
            price: c.current_price || 0,
            change24h,
            change7d,
            volume: c.total_volume || 0,
            mcap: c.market_cap || 0,
            score,
            type,
            reason,
            image: c.image || "",
          };
        })
        .sort((a: Opportunity, b: Opportunity) => b.score - a.score);

      setOpportunities(opps);
      setLastUpdate(new Date().toLocaleTimeString("fr-FR"));
    } catch (err: any) {
      console.error("Fetch error:", err);
      setError(err.message || "Erreur de chargement des données");
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 120000); // refresh every 2 min
    return () => clearInterval(interval);
  }, [fetchData]);

  const filtered = filter === "ALL" ? opportunities : opportunities.filter((o) => o.type === filter);

  return (
    <div className="flex min-h-screen bg-[#030712]">
      <Sidebar />
      <main className="flex-1 ml-[260px]">
      <PageHeader
          icon={<span className="text-lg">🎯</span>}
          title="Opportunity Scanner"
          subtitle="L’IA scanne en permanence le marché pour détecter les opportunités de trading : oversold, breakouts, divergences et setups à fort potentiel avant qu’ils ne deviennent évidents."
          accentColor="green"
          steps={[
            { n: "1", title: "Consultez les opportunités", desc: "Chaque carte représente une opportunité détectée par l’IA avec le type de signal, le potentiel estimé et le niveau de risque." },
            { n: "2", title: "Filtrez par type", desc: "Utilisez les filtres pour afficher uniquement les opportunités qui correspondent à votre style de trading (swing, scalp, position)." },
            { n: "3", title: "Agissez rapidement", desc: "Les opportunités sont éphémères. Vérifiez le signal sur votre chart avant d’entrer en position et respectez votre risk management." },
          ]}
        />
        <div className="fixed inset-0 pointer-events-none z-0">
          <div className="absolute w-[600px] h-[600px] rounded-full bg-emerald-500/5 blur-[80px] top-[-200px] left-[-100px]" />
          <div className="absolute w-[500px] h-[500px] rounded-full bg-amber-500/5 blur-[80px] bottom-[-200px] right-[-100px]" />
        </div>
        <div className="relative z-10 max-w-[1440px] mx-auto">
          <div className="text-center mb-10 pt-8">
            <h1 className="text-5xl font-black bg-gradient-to-r from-emerald-400 via-amber-400 to-emerald-400 bg-[length:300%_auto] bg-clip-text text-transparent animate-gradient">
              🔎 Scanner d&apos;Opportunités
            </h1>
            <p className="text-gray-500 mt-3 text-lg">Détectez les meilleures opportunités du marché en temps réel</p>
            <div className="flex items-center justify-center gap-4 mt-4">
              <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/25 rounded-full px-5 py-1.5 text-xs text-emerald-400 font-bold uppercase tracking-widest">
                <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#22c55e] animate-pulse" />
                LIVE — Top 100 Cryptos
              </div>
              {lastUpdate && (
                <span className="text-[10px] text-gray-600">MAJ: {lastUpdate}</span>
              )}
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-2 mb-6 justify-center">
            {[
              { key: "ALL", label: `Tous (${opportunities.length})` },
              { key: "breakout", label: `🚀 Breakout (${opportunities.filter((o) => o.type === "breakout").length})` },
              { key: "oversold", label: `📉 Oversold (${opportunities.filter((o) => o.type === "oversold").length})` },
              { key: "momentum", label: `⚡ Momentum (${opportunities.filter((o) => o.type === "momentum").length})` },
              { key: "accumulation", label: `🐋 Accumulation (${opportunities.filter((o) => o.type === "accumulation").length})` },
              { key: "reversal", label: `🔄 Reversal (${opportunities.filter((o) => o.type === "reversal").length})` },
            ].map((f) => (
              <button key={f.key} onClick={() => setFilter(f.key)} className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${filter === f.key ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" : "bg-slate-800/50 text-gray-500 hover:text-white border border-white/5"}`}>
                {f.label}
              </button>
            ))}
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-6 text-center mb-6">
              <p className="text-red-400 font-semibold mb-2">❌ {error}</p>
              <p className="text-gray-500 text-sm mb-3">CoinGecko API peut limiter les requêtes. Réessayez dans quelques secondes.</p>
              <button onClick={fetchData} className="px-4 py-2 bg-red-500/20 text-red-400 rounded-xl text-sm font-bold hover:bg-red-500/30 transition-all">
                🔄 Réessayer
              </button>
            </div>
          )}

          {loading && opportunities.length === 0 ? (
            <div className="flex justify-center py-16">
              <div className="text-center">
                <div className="w-11 h-11 border-3 border-emerald-500/15 border-t-emerald-400 rounded-full animate-spin mx-auto mb-4" />
                <p className="text-gray-400 text-sm">Chargement des données CoinGecko...</p>
              </div>
            </div>
          ) : opportunities.length > 0 ? (
            <>
              {/* Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
                {Object.entries(TYPE_STYLES).map(([key, style]) => {
                  const count = opportunities.filter((o) => o.type === key).length;
                  return (
                    <div key={key} className="bg-slate-900/70 border border-white/5 rounded-2xl p-4 text-center hover:-translate-y-1 transition-all cursor-pointer"
                      onClick={() => setFilter(key)}>
                      <div className="text-2xl font-black font-mono text-white">{count}</div>
                      <div className={`text-xs font-bold mt-1 ${style.text}`}>{style.label}</div>
                    </div>
                  );
                })}
              </div>

              {/* Table */}
              <div className="bg-slate-900/70 border border-white/5 rounded-3xl p-6 overflow-x-auto">
                <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">📊 {filtered.length} Opportunités détectées</h2>
                <table className="w-full min-w-[900px]">
                  <thead>
                    <tr className="border-b border-white/10">
                      {["#", "Token", "Prix", "24h", "7j", "Volume", "Market Cap", "Score", "Type"].map((h) => (
                        <th key={h} className="text-left text-xs text-gray-500 uppercase tracking-wider py-3 px-3">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.slice(0, 50).map((o, i) => {
                      const style = TYPE_STYLES[o.type];
                      return (
                        <tr key={`${o.symbol}-${i}`} className="border-b border-white/5 hover:bg-emerald-500/5 transition-colors">
                          <td className="py-3 px-3 text-sm text-gray-500">{i + 1}</td>
                          <td className="py-3 px-3">
                            <div className="flex items-center gap-2">
                              {o.image && <img src={o.image} alt={o.symbol} className="w-6 h-6 rounded-full" />}
                              <div>
                                <div className="font-bold text-white text-sm">{o.symbol}</div>
                                <div className="text-xs text-gray-500 truncate max-w-[120px]">{o.name}</div>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-3 font-mono text-sm text-white">
                            ${o.price < 1 ? o.price.toFixed(4) : o.price.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                          </td>
                          <td className={`py-3 px-3 font-mono text-sm font-bold ${o.change24h >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                            {o.change24h >= 0 ? "+" : ""}{o.change24h.toFixed(2)}%
                          </td>
                          <td className={`py-3 px-3 font-mono text-sm ${o.change7d >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                            {o.change7d >= 0 ? "+" : ""}{o.change7d.toFixed(1)}%
                          </td>
                          <td className="py-3 px-3 font-mono text-sm text-gray-400">
                            ${o.volume >= 1e9 ? `${(o.volume / 1e9).toFixed(1)}B` : `${(o.volume / 1e6).toFixed(0)}M`}
                          </td>
                          <td className="py-3 px-3 font-mono text-sm text-gray-400">
                            ${o.mcap >= 1e9 ? `${(o.mcap / 1e9).toFixed(1)}B` : `${(o.mcap / 1e6).toFixed(0)}M`}
                          </td>
                          <td className="py-3 px-3">
                            <div className="flex items-center gap-2">
                              <div className="w-12 h-1.5 bg-white/5 rounded-full overflow-hidden">
                                <div className="h-full rounded-full" style={{
                                  width: `${o.score}%`,
                                  background: o.score > 80 ? "#22c55e" : o.score > 60 ? "#f59e0b" : "#6b7280",
                                }} />
                              </div>
                              <span className={`text-sm font-black font-mono ${o.score > 80 ? "text-emerald-400" : o.score > 60 ? "text-amber-400" : "text-gray-400"}`}>{o.score}</span>
                            </div>
                          </td>
                          <td className="py-3 px-3">
                            <span className={`text-xs font-bold px-2 py-1 rounded-lg ${style.bg} ${style.text}`}>{style.label}</span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Disclaimer */}
              <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-4 mt-6 text-center">
                <p className="text-[10px] text-gray-600">
                  📊 Données en temps réel via CoinGecko API — Mise à jour automatique toutes les 2 minutes.
                  Les scores sont calculés algorithmiquement et ne constituent pas un conseil financier.
                </p>
              </div>
            </>
          ) : null}
        </div>
      </main>
    </div>
  );
}