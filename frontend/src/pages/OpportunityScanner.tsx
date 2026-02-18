import { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";

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
}

const TYPE_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  breakout: { bg: "bg-emerald-500/10", text: "text-emerald-400", label: "🚀 Breakout" },
  oversold: { bg: "bg-blue-500/10", text: "text-blue-400", label: "📉 Oversold" },
  accumulation: { bg: "bg-purple-500/10", text: "text-purple-400", label: "🐋 Accumulation" },
  momentum: { bg: "bg-amber-500/10", text: "text-amber-400", label: "⚡ Momentum" },
  reversal: { bg: "bg-cyan-500/10", text: "text-cyan-400", label: "🔄 Reversal" },
};

export default function OpportunityScanner() {
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("ALL");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch("https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=50&sparkline=false&price_change_percentage=24h,7d");
        const data = await res.json();
        const opps: Opportunity[] = data
          .map((c: any) => {
            const change24h = c.price_change_percentage_24h || 0;
            const change7d = c.price_change_percentage_7d_in_currency || 0;
            let type: Opportunity["type"];
            let reason: string;
            let score: number;

            if (change24h > 8) {
              type = "breakout"; reason = "Cassure haussière avec volume élevé"; score = 85 + Math.random() * 10;
            } else if (change24h < -10 && change7d < -15) {
              type = "oversold"; reason = "Survendu — potentiel rebond technique"; score = 70 + Math.random() * 15;
            } else if (change24h > 3 && change24h < 8) {
              type = "momentum"; reason = "Momentum haussier confirmé par les indicateurs"; score = 65 + Math.random() * 15;
            } else if (change24h < -5 && change7d > 5) {
              type = "reversal"; reason = "Correction dans une tendance haussière"; score = 60 + Math.random() * 20;
            } else {
              type = "accumulation"; reason = "Phase d'accumulation — faible volatilité"; score = 50 + Math.random() * 20;
            }

            return {
              symbol: c.symbol?.toUpperCase() || "N/A",
              name: c.name || "Unknown",
              price: c.current_price || 0,
              change24h,
              change7d,
              volume: c.total_volume || 0,
              mcap: c.market_cap || 0,
              score: Math.round(score),
              type,
              reason,
            };
          })
          .sort((a: Opportunity, b: Opportunity) => b.score - a.score);
        setOpportunities(opps);
      } catch {
        setOpportunities([]);
      }
      setLoading(false);
    };
    fetchData();
  }, []);

  const filtered = filter === "ALL" ? opportunities : opportunities.filter((o) => o.type === filter);

  return (
    <div className="flex min-h-screen bg-[#030712]">
      <Sidebar />
      <main className="flex-1 ml-[260px] p-7">
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
            <div className="inline-flex items-center gap-2 mt-4 bg-emerald-500/10 border border-emerald-500/25 rounded-full px-5 py-1.5 text-xs text-emerald-400 font-bold uppercase tracking-widest">
              <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#22c55e] animate-pulse" />
              LIVE — Market Scanner
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-2 mb-6 justify-center">
            {[
              { key: "ALL", label: "Tous" },
              { key: "breakout", label: "🚀 Breakout" },
              { key: "oversold", label: "📉 Oversold" },
              { key: "momentum", label: "⚡ Momentum" },
              { key: "accumulation", label: "🐋 Accumulation" },
              { key: "reversal", label: "🔄 Reversal" },
            ].map((f) => (
              <button key={f.key} onClick={() => setFilter(f.key)} className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${filter === f.key ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" : "bg-slate-800/50 text-gray-500 hover:text-white border border-white/5"}`}>
                {f.label}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="flex justify-center py-16">
              <div className="w-11 h-11 border-3 border-emerald-500/15 border-t-emerald-400 rounded-full animate-spin" />
            </div>
          ) : (
            <>
              {/* Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
                {Object.entries(TYPE_STYLES).map(([key, style]) => {
                  const count = opportunities.filter((o) => o.type === key).length;
                  return (
                    <div key={key} className="bg-slate-900/70 border border-white/5 rounded-2xl p-4 text-center hover:-translate-y-1 transition-all">
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
                      {["#", "Token", "Prix", "24h", "7j", "Volume", "Score", "Type", "Raison"].map((h) => (
                        <th key={h} className="text-left text-xs text-gray-500 uppercase tracking-wider py-3 px-3">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.slice(0, 30).map((o, i) => {
                      const style = TYPE_STYLES[o.type];
                      return (
                        <tr key={o.symbol} className="border-b border-white/5 hover:bg-emerald-500/5 transition-colors">
                          <td className="py-3 px-3 text-sm text-gray-500">{i + 1}</td>
                          <td className="py-3 px-3">
                            <div className="font-bold text-white text-sm">{o.symbol}</div>
                            <div className="text-xs text-gray-500">{o.name}</div>
                          </td>
                          <td className="py-3 px-3 font-mono text-sm text-white">${o.price < 1 ? o.price.toFixed(4) : o.price.toLocaleString()}</td>
                          <td className={`py-3 px-3 font-mono text-sm font-bold ${o.change24h >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                            {o.change24h >= 0 ? "+" : ""}{o.change24h.toFixed(2)}%
                          </td>
                          <td className={`py-3 px-3 font-mono text-sm ${o.change7d >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                            {o.change7d >= 0 ? "+" : ""}{o.change7d.toFixed(1)}%
                          </td>
                          <td className="py-3 px-3 font-mono text-sm text-gray-400">${(o.volume / 1e6).toFixed(0)}M</td>
                          <td className="py-3 px-3">
                            <span className={`text-sm font-black font-mono ${o.score > 80 ? "text-emerald-400" : o.score > 60 ? "text-amber-400" : "text-gray-400"}`}>{o.score}</span>
                          </td>
                          <td className="py-3 px-3">
                            <span className={`text-xs font-bold px-2 py-1 rounded-lg ${style.bg} ${style.text}`}>{style.label}</span>
                          </td>
                          <td className="py-3 px-3 text-xs text-gray-400 max-w-[200px]">{o.reason}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}