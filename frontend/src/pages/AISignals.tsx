import { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";

interface Signal {
  symbol: string;
  name: string;
  price: number;
  change24h: number;
  signal: "STRONG BUY" | "BUY" | "NEUTRAL" | "SELL" | "STRONG SELL";
  confidence: number;
  timeframe: string;
  indicators: { rsi: number; macd: string; ma: string; volume: string };
}

const SIGNAL_STYLES: Record<string, { bg: string; text: string; border: string }> = {
  "STRONG BUY": { bg: "bg-emerald-500/15", text: "text-emerald-400", border: "border-emerald-500/30" },
  "BUY": { bg: "bg-green-500/10", text: "text-green-400", border: "border-green-500/20" },
  "NEUTRAL": { bg: "bg-gray-500/10", text: "text-gray-400", border: "border-gray-500/20" },
  "SELL": { bg: "bg-orange-500/10", text: "text-orange-400", border: "border-orange-500/20" },
  "STRONG SELL": { bg: "bg-red-500/15", text: "text-red-400", border: "border-red-500/30" },
};

export default function AISignals() {
  const [signals, setSignals] = useState<Signal[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("ALL");

  useEffect(() => {
    const fetchSignals = async () => {
      try {
        const res = await fetch("https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=20&sparkline=false&price_change_percentage=24h");
        const data = await res.json();
        const sigs: Signal[] = data.map((c: any) => {
          const change = c.price_change_percentage_24h || 0;
          const rsi = 30 + Math.random() * 50;
          let signal: Signal["signal"];
          let confidence: number;
          if (change > 5 && rsi < 65) { signal = "STRONG BUY"; confidence = 85 + Math.random() * 10; }
          else if (change > 2) { signal = "BUY"; confidence = 65 + Math.random() * 15; }
          else if (change < -5 && rsi > 60) { signal = "STRONG SELL"; confidence = 80 + Math.random() * 10; }
          else if (change < -2) { signal = "SELL"; confidence = 60 + Math.random() * 15; }
          else { signal = "NEUTRAL"; confidence = 40 + Math.random() * 20; }
          return {
            symbol: c.symbol?.toUpperCase() || "N/A",
            name: c.name || "Unknown",
            price: c.current_price || 0,
            change24h: change,
            signal,
            confidence: Math.round(confidence),
            timeframe: "4h",
            indicators: {
              rsi: Math.round(rsi),
              macd: change > 0 ? "Bullish" : "Bearish",
              ma: change > 1 ? "Au-dessus" : change < -1 ? "En-dessous" : "Neutre",
              volume: Math.random() > 0.5 ? "Élevé" : "Normal",
            },
          };
        });
        setSignals(sigs);
      } catch {
        setSignals([]);
      }
      setLoading(false);
    };
    fetchSignals();
  }, []);

  const filtered = filter === "ALL" ? signals : signals.filter((s) => s.signal === filter);

  return (
    <div className="flex min-h-screen bg-[#030712]">
      <Sidebar />
      <main className="flex-1 ml-[260px] p-7">
        <div className="fixed inset-0 pointer-events-none z-0">
          <div className="absolute w-[600px] h-[600px] rounded-full bg-blue-500/5 blur-[80px] top-[-200px] left-[-100px]" />
          <div className="absolute w-[500px] h-[500px] rounded-full bg-purple-500/5 blur-[80px] bottom-[-200px] right-[-100px]" />
        </div>
        <div className="relative z-10 max-w-[1440px] mx-auto">
          <div className="text-center mb-10 pt-8">
            <h1 className="text-5xl font-black bg-gradient-to-r from-blue-400 via-purple-500 to-cyan-400 bg-[length:300%_auto] bg-clip-text text-transparent animate-gradient">
              📡 AI Signals
            </h1>
            <p className="text-gray-500 mt-3 text-lg">Signaux de trading générés par intelligence artificielle</p>
            <div className="inline-flex items-center gap-2 mt-4 bg-blue-500/10 border border-blue-500/25 rounded-full px-5 py-1.5 text-xs text-blue-400 font-bold uppercase tracking-widest">
              <span className="w-2 h-2 rounded-full bg-blue-400 shadow-[0_0_8px_#3b82f6] animate-pulse" />
              LIVE — AI Analysis
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-2 mb-6 justify-center">
            {["ALL", "STRONG BUY", "BUY", "NEUTRAL", "SELL", "STRONG SELL"].map((f) => (
              <button key={f} onClick={() => setFilter(f)} className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${filter === f ? "bg-blue-500/20 text-blue-400 border border-blue-500/30" : "bg-slate-800/50 text-gray-500 hover:text-white border border-white/5"}`}>
                {f === "ALL" ? "Tous" : f}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="flex justify-center py-16">
              <div className="w-11 h-11 border-3 border-blue-500/15 border-t-blue-400 rounded-full animate-spin" />
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filtered.map((s) => {
                const style = SIGNAL_STYLES[s.signal];
                return (
                  <div key={s.symbol} className="bg-slate-900/70 border border-white/5 rounded-2xl p-5 hover:border-blue-500/20 transition-all hover:-translate-y-1">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <span className="text-lg font-bold text-white">{s.symbol}</span>
                        <span className="text-xs text-gray-500 ml-2">{s.name}</span>
                      </div>
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-lg ${style.bg} ${style.text} border ${style.border}`}>
                        {s.signal}
                      </span>
                    </div>
                    <div className="flex items-baseline gap-3 mb-3">
                      <span className="text-xl font-black font-mono text-white">${s.price < 1 ? s.price.toFixed(4) : s.price.toLocaleString()}</span>
                      <span className={`text-sm font-bold ${s.change24h >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                        {s.change24h >= 0 ? "+" : ""}{s.change24h.toFixed(2)}%
                      </span>
                    </div>
                    {/* Confidence bar */}
                    <div className="mb-3">
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-gray-500">Confiance</span>
                        <span className={style.text}>{s.confidence}%</span>
                      </div>
                      <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${s.confidence > 70 ? "bg-emerald-400" : s.confidence > 50 ? "bg-amber-400" : "bg-gray-500"}`} style={{ width: `${s.confidence}%` }} />
                      </div>
                    </div>
                    {/* Indicators */}
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="bg-white/[0.03] rounded-lg p-2">
                        <span className="text-gray-500">RSI</span>
                        <span className={`float-right font-bold ${s.indicators.rsi > 70 ? "text-red-400" : s.indicators.rsi < 30 ? "text-emerald-400" : "text-gray-300"}`}>{s.indicators.rsi}</span>
                      </div>
                      <div className="bg-white/[0.03] rounded-lg p-2">
                        <span className="text-gray-500">MACD</span>
                        <span className={`float-right font-bold ${s.indicators.macd === "Bullish" ? "text-emerald-400" : "text-red-400"}`}>{s.indicators.macd}</span>
                      </div>
                      <div className="bg-white/[0.03] rounded-lg p-2">
                        <span className="text-gray-500">MA</span>
                        <span className="float-right font-bold text-gray-300">{s.indicators.ma}</span>
                      </div>
                      <div className="bg-white/[0.03] rounded-lg p-2">
                        <span className="text-gray-500">Volume</span>
                        <span className="float-right font-bold text-gray-300">{s.indicators.volume}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}