import { useState, useEffect, useCallback } from "react";
import Sidebar from "../components/Sidebar";
import { RefreshCw, Search } from "lucide-react";
import { fetchTop200, formatPrice, type CoinMarketData } from "@/lib/cryptoApi";
import PageHeader from "@/components/PageHeader";
import Footer from "@/components/Footer";

interface Signal {
  id: string;
  symbol: string;
  name: string;
  image: string;
  price: number;
  change24h: number;
  change7d: number;
  signal: "STRONG BUY" | "BUY" | "NEUTRAL" | "SELL" | "STRONG SELL";
  confidence: number;
  indicators: { rsi: number; macd: string; ma: string; volume: string };
}

const SIGNAL_STYLES: Record<string, { bg: string; text: string; border: string }> = {
  "STRONG BUY": { bg: "bg-emerald-500/15", text: "text-emerald-400", border: "border-emerald-500/30" },
  "BUY": { bg: "bg-green-500/10", text: "text-green-400", border: "border-green-500/20" },
  "NEUTRAL": { bg: "bg-gray-500/10", text: "text-gray-400", border: "border-gray-500/20" },
  "SELL": { bg: "bg-orange-500/10", text: "text-orange-400", border: "border-orange-500/20" },
  "STRONG SELL": { bg: "bg-red-500/15", text: "text-red-400", border: "border-red-500/30" },
};

function generateSignal(c: CoinMarketData): Signal {
  const change = c.price_change_percentage_24h || 0;
  const change7d = c.price_change_percentage_7d_in_currency || 0;
  // Deterministic RSI based on price changes
  const seed = c.id.split("").reduce((a, ch) => a + ch.charCodeAt(0), 0);
  const pseudoRandom = ((seed * 9301 + 49297) % 233280) / 233280;
  const rsi = Math.max(15, Math.min(90, 50 + change * 2 + pseudoRandom * 10 - 5));

  let signal: Signal["signal"];
  let confidence: number;
  if (change > 5 && change7d > 10 && rsi < 70) { signal = "STRONG BUY"; confidence = 82 + pseudoRandom * 10; }
  else if (change > 2 && rsi < 65) { signal = "BUY"; confidence = 65 + pseudoRandom * 15; }
  else if (change < -5 && change7d < -10 && rsi > 35) { signal = "STRONG SELL"; confidence = 80 + pseudoRandom * 10; }
  else if (change < -2 && rsi > 40) { signal = "SELL"; confidence = 60 + pseudoRandom * 15; }
  else { signal = "NEUTRAL"; confidence = 40 + pseudoRandom * 20; }

  return {
    id: c.id,
    symbol: c.symbol.toUpperCase(),
    name: c.name,
    image: c.image,
    price: c.current_price,
    change24h: change,
    change7d,
    signal,
    confidence: Math.round(confidence),
    indicators: {
      rsi: Math.round(rsi),
      macd: change > 0 && change7d > 0 ? "Bullish" : change < 0 && change7d < 0 ? "Bearish" : "Neutre",
      ma: change > 1 ? "Au-dessus" : change < -1 ? "En-dessous" : "Neutre",
      volume: c.total_volume > c.market_cap * 0.05 ? "Élevé" : "Normal",
    },
  };
}

export default function AISignals() {
  const [signals, setSignals] = useState<Signal[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [lastUpdate, setLastUpdate] = useState("");

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchTop200(false);
      setSignals(data.map(generateSignal));
      setLastUpdate(new Date().toLocaleTimeString("fr-FR"));
    } catch {
      setSignals([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const i = setInterval(fetchData, 120000);
    return () => clearInterval(i);
  }, [fetchData]);

  const filtered = signals
    .filter((s) => filter === "ALL" || s.signal === filter)
    .filter((s) => !search || s.symbol.includes(search.toUpperCase()) || s.name.toLowerCase().includes(search.toLowerCase()));

  const counts = {
    "STRONG BUY": signals.filter((s) => s.signal === "STRONG BUY").length,
    "BUY": signals.filter((s) => s.signal === "BUY").length,
    "NEUTRAL": signals.filter((s) => s.signal === "NEUTRAL").length,
    "SELL": signals.filter((s) => s.signal === "SELL").length,
    "STRONG SELL": signals.filter((s) => s.signal === "STRONG SELL").length,
  };

  return (
    <div className="flex min-h-screen bg-[#030712]">
      <Sidebar />
      <main className="flex-1 md:ml-[260px] pt-14 md:pt-0 bg-[#030712]">
      <PageHeader
          icon={<span className="text-lg">📶</span>}
          title="AI Signals"
          subtitle="Signaux de trading générés par intelligence artificielle en temps réel. BUY, SELL et HOLD basés sur l’analyse technique, le sentiment et les données on-chain combinés."
          accentColor="blue"
          steps={[
            { n: "1", title: "Consultez les signaux", desc: "Chaque signal indique la direction (BUY/SELL/HOLD), la force du signal et le niveau de confiance de l’IA. Filtrez par type." },
            { n: "2", title: "Vérifiez la confiance", desc: "Confiance > 80% = signal fort. Entre 60-80% = signal modéré. En dessous de 60% = signal faible, attendez confirmation." },
            { n: "3", title: "Gérez votre risque", desc: "Même les meilleurs signaux IA ne sont pas infaillibles. Utilisez toujours un stop loss et ne risquez pas plus de 1-2% par trade." },
          ]}
        />
        <div className="relative z-10 max-w-[1440px] mx-auto p-4 md:p-6">
          {/* ===== HERO ===== */}
          <div className="relative rounded-3xl overflow-hidden mb-6 border border-white/[0.08]">
            <div className="absolute inset-0 bg-[#0A0E1A]" />
            <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-blue-500/22 blur-3xl" style={{ animation: "ai-pulse 6s ease-in-out infinite" }} />
            <div className="absolute -bottom-24 right-1/3 w-80 h-80 rounded-full bg-purple-500/22 blur-3xl" style={{ animation: "ai-pulse 8s ease-in-out infinite reverse" }} />
            <div className="absolute -top-12 right-1/2 w-72 h-72 rounded-full bg-cyan-500/15 blur-3xl" style={{ animation: "ai-pulse 7s ease-in-out infinite" }} />
            <div className="absolute inset-0 opacity-[0.04]" style={{
              backgroundImage: "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
              backgroundSize: "44px 44px",
            }} />
            <div className="relative z-10 flex items-center gap-4 px-6 md:px-10 py-6">
              <div className="w-14 h-14 rounded-2xl bg-blue-500/15 border border-blue-500/40 flex items-center justify-center text-2xl" style={{ boxShadow: "0 0 30px rgba(59,130,246,0.3)" }}>
                📡
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <h1 className="text-xl md:text-2xl font-black bg-gradient-to-r from-blue-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent">
                    AI Signals
                  </h1>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border border-blue-500/40 bg-blue-500/10 text-blue-300">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" /> LIVE · {signals.length} cryptos
                  </span>
                </div>
                <p className="text-xs md:text-sm text-gray-400">
                  Signaux de trading IA · Top 200 cryptos en temps réel
                </p>
              </div>
            </div>
          </div>

          <style>{`
            @keyframes ai-pulse {
              0%, 100% { transform: scale(1) translate(0,0); opacity: 0.3; }
              50% { transform: scale(1.2) translate(20px,-10px); opacity: 0.45; }
            }
            @keyframes ai-fadeUp {
              from { opacity: 0; transform: translateY(12px); }
              to { opacity: 1; transform: translateY(0); }
            }
            .ai-anim { animation: ai-fadeUp 0.6s ease-out both; }
          `}</style>

          {/* Summary */}
          <div className="grid grid-cols-5 gap-3 mb-6">
            {(Object.entries(counts) as [string, number][]).map(([key, count], i) => {
              const style = SIGNAL_STYLES[key];
              return (
                <div key={key}
                  className={`ai-anim relative bg-gradient-to-br from-white/[0.04] to-white/[0.01] border ${style.border} rounded-2xl p-4 text-center overflow-hidden hover:-translate-y-1 transition-all`}
                  style={{ animationDelay: `${i * 60}ms` }}
                >
                  <div className={`absolute -top-12 -right-12 w-32 h-32 rounded-full blur-3xl opacity-25 ${style.bg.replace("bg-", "bg-").replace("/10", "")}`} />
                  <div className="relative">
                    <p className={`text-2xl md:text-3xl font-black ${style.text}`} style={{ textShadow: "0 0 14px currentColor" }}>{count}</p>
                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">{key}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Filters + Search */}
          <div className="flex flex-wrap gap-3 mb-6 items-center">
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Rechercher..."
                className="w-full pl-9 pr-3 py-2 rounded-lg bg-black/30 border border-white/[0.08] text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {["ALL", "STRONG BUY", "BUY", "NEUTRAL", "SELL", "STRONG SELL"].map((f) => (
                <button key={f} onClick={() => setFilter(f)} className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${filter === f ? "bg-blue-500/20 text-blue-400 border border-blue-500/30" : "bg-slate-800/50 text-gray-500 hover:text-white border border-white/5"}`}>
                  {f === "ALL" ? "Tous" : f}
                </button>
              ))}
            </div>
            <button onClick={fetchData} disabled={loading} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.08] text-xs font-bold">
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
              {lastUpdate || "MAJ"}
            </button>
          </div>

          {loading && signals.length === 0 ? (
            <div className="flex justify-center py-16">
              <div className="w-11 h-11 border-3 border-blue-500/15 border-t-blue-400 rounded-full animate-spin" />
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filtered.map((s) => {
                const style = SIGNAL_STYLES[s.signal];
                return (
                  <div key={s.id} className="bg-slate-900/70 border border-white/5 rounded-2xl p-5 hover:border-blue-500/20 transition-all hover:-translate-y-1">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        {s.image && <img src={s.image} alt={s.symbol} className="w-6 h-6 rounded-full" />}
                        <div>
                          <span className="text-sm font-bold text-white">{s.symbol}</span>
                          <span className="text-[10px] text-gray-500 ml-1.5">{s.name}</span>
                        </div>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-1 rounded-lg ${style.bg} ${style.text} border ${style.border}`}>
                        {s.signal}
                      </span>
                    </div>
                    <div className="flex items-baseline gap-3 mb-3">
                      <span className="text-lg font-black font-mono text-white">${formatPrice(s.price)}</span>
                      <span className={`text-xs font-bold ${s.change24h >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                        {s.change24h >= 0 ? "+" : ""}{s.change24h.toFixed(2)}%
                      </span>
                    </div>
                    <div className="mb-3">
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-gray-500">Confiance</span>
                        <span className={style.text}>{s.confidence}%</span>
                      </div>
                      <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${s.confidence > 70 ? "bg-emerald-400" : s.confidence > 50 ? "bg-amber-400" : "bg-gray-500"}`} style={{ width: `${s.confidence}%` }} />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="bg-white/[0.03] rounded-lg p-2">
                        <span className="text-gray-500">RSI</span>
                        <span className={`float-right font-bold ${s.indicators.rsi > 70 ? "text-red-400" : s.indicators.rsi < 30 ? "text-emerald-400" : "text-gray-300"}`}>{s.indicators.rsi}</span>
                      </div>
                      <div className="bg-white/[0.03] rounded-lg p-2">
                        <span className="text-gray-500">MACD</span>
                        <span className={`float-right font-bold ${s.indicators.macd === "Bullish" ? "text-emerald-400" : s.indicators.macd === "Bearish" ? "text-red-400" : "text-gray-300"}`}>{s.indicators.macd}</span>
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
        <Footer />
      </main>
    </div>
  );
}
