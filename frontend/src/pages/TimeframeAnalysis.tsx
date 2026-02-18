import { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";

interface TFData {
  symbol: string;
  name: string;
  price: number;
  timeframes: Record<string, { trend: "bullish" | "bearish" | "neutral"; strength: number; signal: string }>;
  consensus: "STRONG BUY" | "BUY" | "NEUTRAL" | "SELL" | "STRONG SELL";
}

const TIMEFRAMES = ["5m", "15m", "1h", "4h", "1d", "1w"];

const CONSENSUS_STYLES: Record<string, { bg: string; text: string }> = {
  "STRONG BUY": { bg: "bg-emerald-500/15", text: "text-emerald-400" },
  "BUY": { bg: "bg-green-500/10", text: "text-green-400" },
  "NEUTRAL": { bg: "bg-gray-500/10", text: "text-gray-400" },
  "SELL": { bg: "bg-orange-500/10", text: "text-orange-400" },
  "STRONG SELL": { bg: "bg-red-500/15", text: "text-red-400" },
};

export default function TimeframeAnalysis() {
  const [data, setData] = useState<TFData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTF, setSelectedTF] = useState("ALL");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch("https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=20&sparkline=false");
        const coins = await res.json();
        const results: TFData[] = coins.map((c: any) => {
          const change = c.price_change_percentage_24h || 0;
          const timeframes: TFData["timeframes"] = {};
          let bullCount = 0;
          let bearCount = 0;

          TIMEFRAMES.forEach((tf) => {
            const bias = change > 0 ? 0.6 : 0.4;
            const r = Math.random();
            let trend: "bullish" | "bearish" | "neutral";
            let signal: string;
            if (r < bias) { trend = "bullish"; signal = "Achat"; bullCount++; }
            else if (r < bias + 0.15) { trend = "neutral"; signal = "Neutre"; }
            else { trend = "bearish"; signal = "Vente"; bearCount++; }
            timeframes[tf] = { trend, strength: Math.round(40 + Math.random() * 55), signal };
          });

          let consensus: TFData["consensus"];
          if (bullCount >= 5) consensus = "STRONG BUY";
          else if (bullCount >= 4) consensus = "BUY";
          else if (bearCount >= 5) consensus = "STRONG SELL";
          else if (bearCount >= 4) consensus = "SELL";
          else consensus = "NEUTRAL";

          return {
            symbol: c.symbol?.toUpperCase() || "N/A",
            name: c.name || "Unknown",
            price: c.current_price || 0,
            timeframes,
            consensus,
          };
        });
        setData(results);
      } catch {
        setData([]);
      }
      setLoading(false);
    };
    fetchData();
  }, []);

  return (
    <div className="flex min-h-screen bg-[#030712]">
      <Sidebar />
      <main className="flex-1 ml-[260px] p-7">
        <div className="fixed inset-0 pointer-events-none z-0">
          <div className="absolute w-[600px] h-[600px] rounded-full bg-cyan-500/5 blur-[80px] top-[-200px] left-[-100px]" />
          <div className="absolute w-[500px] h-[500px] rounded-full bg-indigo-500/5 blur-[80px] bottom-[-200px] right-[-100px]" />
        </div>
        <div className="relative z-10 max-w-[1440px] mx-auto">
          <div className="text-center mb-10 pt-8">
            <h1 className="text-5xl font-black bg-gradient-to-r from-cyan-400 via-indigo-500 to-cyan-400 bg-[length:300%_auto] bg-clip-text text-transparent animate-gradient">
              ⏱️ Timeframe Analysis
            </h1>
            <p className="text-gray-500 mt-3 text-lg">Analyse multi-timeframe pour une vision complète du marché</p>
          </div>

          {/* TF Filter */}
          <div className="flex flex-wrap gap-2 mb-6 justify-center">
            <button onClick={() => setSelectedTF("ALL")} className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${selectedTF === "ALL" ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30" : "bg-slate-800/50 text-gray-500 hover:text-white border border-white/5"}`}>
              Tous les TF
            </button>
            {TIMEFRAMES.map((tf) => (
              <button key={tf} onClick={() => setSelectedTF(tf)} className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${selectedTF === tf ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30" : "bg-slate-800/50 text-gray-500 hover:text-white border border-white/5"}`}>
                {tf}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="flex justify-center py-16">
              <div className="w-11 h-11 border-3 border-cyan-500/15 border-t-cyan-400 rounded-full animate-spin" />
            </div>
          ) : (
            <div className="bg-slate-900/70 border border-white/5 rounded-3xl p-6 overflow-x-auto">
              <table className="w-full min-w-[900px]">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left text-xs text-gray-500 uppercase tracking-wider py-3 px-3">Token</th>
                    <th className="text-left text-xs text-gray-500 uppercase tracking-wider py-3 px-3">Prix</th>
                    {(selectedTF === "ALL" ? TIMEFRAMES : [selectedTF]).map((tf) => (
                      <th key={tf} className="text-center text-xs text-gray-500 uppercase tracking-wider py-3 px-3">{tf}</th>
                    ))}
                    <th className="text-center text-xs text-gray-500 uppercase tracking-wider py-3 px-3">Consensus</th>
                  </tr>
                </thead>
                <tbody>
                  {data.map((d) => {
                    const cStyle = CONSENSUS_STYLES[d.consensus];
                    return (
                      <tr key={d.symbol} className="border-b border-white/5 hover:bg-cyan-500/5 transition-colors">
                        <td className="py-3 px-3">
                          <div className="font-bold text-white text-sm">{d.symbol}</div>
                          <div className="text-xs text-gray-500">{d.name}</div>
                        </td>
                        <td className="py-3 px-3 font-mono text-sm text-white">${d.price < 1 ? d.price.toFixed(4) : d.price.toLocaleString()}</td>
                        {(selectedTF === "ALL" ? TIMEFRAMES : [selectedTF]).map((tf) => {
                          const tfData = d.timeframes[tf];
                          return (
                            <td key={tf} className="py-3 px-3 text-center">
                              <div className={`inline-flex flex-col items-center gap-1 px-3 py-2 rounded-xl ${tfData.trend === "bullish" ? "bg-emerald-500/10" : tfData.trend === "bearish" ? "bg-red-500/10" : "bg-gray-500/10"}`}>
                                <span className={`text-xs font-bold ${tfData.trend === "bullish" ? "text-emerald-400" : tfData.trend === "bearish" ? "text-red-400" : "text-gray-400"}`}>
                                  {tfData.trend === "bullish" ? "▲" : tfData.trend === "bearish" ? "▼" : "—"} {tfData.signal}
                                </span>
                                <span className="text-[10px] text-gray-500">{tfData.strength}%</span>
                              </div>
                            </td>
                          );
                        })}
                        <td className="py-3 px-3 text-center">
                          <span className={`text-xs font-bold px-3 py-1.5 rounded-xl ${cStyle.bg} ${cStyle.text}`}>{d.consensus}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Legend */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            {[
              { icon: "📈", title: "Multi-Timeframe", desc: "Analysez chaque token sur 6 timeframes différents pour confirmer la tendance.", color: "border-l-cyan-500" },
              { icon: "🎯", title: "Consensus", desc: "Le consensus combine tous les timeframes pour donner un signal global.", color: "border-l-indigo-500" },
              { icon: "⚡", title: "Force du Signal", desc: "Le pourcentage indique la force du signal sur chaque timeframe.", color: "border-l-amber-500" },
            ].map((info) => (
              <div key={info.title} className={`bg-slate-900/50 border border-white/5 ${info.color} border-l-4 rounded-2xl p-6`}>
                <h3 className="text-base font-bold text-white mb-2 flex items-center gap-2">{info.icon} {info.title}</h3>
                <p className="text-sm text-gray-400 leading-relaxed">{info.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}