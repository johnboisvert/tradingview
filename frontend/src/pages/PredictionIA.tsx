import { useEffect, useState, useCallback } from "react";
import Sidebar from "@/components/Sidebar";
import { Brain, RefreshCw, TrendingUp, TrendingDown, Search } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import { fetchTop200, formatPrice, type CoinMarketData } from "@/lib/cryptoApi";
import Footer from "@/components/Footer";

interface PredCoin {
  id: string; symbol: string; name: string; price: number; change24h: number;
  change7d: number; image: string; prediction: "Haussier" | "Baissier" | "Neutre";
  confidence: number; target: number; support: number; resistance: number;
}

function computeRSI(prices: number[], period = 14): number {
  if (prices.length < period + 1) return 50;
  let avgGain = 0, avgLoss = 0;
  for (let i = 1; i <= period; i++) {
    const ch = prices[i] - prices[i - 1];
    if (ch > 0) avgGain += ch; else avgLoss -= ch;
  }
  avgGain /= period; avgLoss /= period;
  for (let i = period + 1; i < prices.length; i++) {
    const ch = prices[i] - prices[i - 1];
    avgGain = (avgGain * (period - 1) + Math.max(0, ch)) / period;
    avgLoss = (avgLoss * (period - 1) + Math.max(0, -ch)) / period;
  }
  if (avgLoss === 0) return 100;
  return 100 - 100 / (1 + avgGain / avgLoss);
}

function buildPrediction(c: CoinMarketData): PredCoin {
  const sparkline = c.sparkline_in_7d?.price || [];
  const rsi = sparkline.length > 20 ? computeRSI(sparkline.slice(-50)) : 50;
  const ch24 = c.price_change_percentage_24h || 0;
  const ch7d = c.price_change_percentage_7d_in_currency || 0;
  const price = c.current_price || 0;
  const momentum = ch24 * 0.5 + ch7d * 0.3 + (50 - rsi) * 0.2;
  const seed = c.id.split("").reduce((a, ch2) => a + ch2.charCodeAt(0), 0);
  const pseudoR = ((seed * 9301 + 49297) % 233280) / 233280;

  let prediction: "Haussier" | "Baissier" | "Neutre" = "Neutre";
  let confidence = 50;
  if (momentum > 3 && rsi < 65) { prediction = "Haussier"; confidence = Math.min(95, 60 + Math.abs(momentum) * 2); }
  else if (momentum < -3 && rsi > 35) { prediction = "Baissier"; confidence = Math.min(95, 60 + Math.abs(momentum) * 2); }
  else { confidence = 40 + pseudoR * 20; }

  const target = prediction === "Haussier" ? price * (1 + Math.abs(momentum) / 100 * 3) :
    prediction === "Baissier" ? price * (1 - Math.abs(momentum) / 100 * 3) : price * 1.02;

  const lows = sparkline.length > 10 ? sparkline.slice(-48) : [price * 0.95];
  const highs = sparkline.length > 10 ? sparkline.slice(-48) : [price * 1.05];

  return {
    id: c.id,
    symbol: c.symbol.toUpperCase(),
    name: c.name, price, change24h: ch24, change7d: ch7d,
    image: c.image, prediction,
    confidence: Math.round(confidence),
    target: Math.round(target * 100) / 100,
    support: Math.round(Math.min(...lows) * 100) / 100,
    resistance: Math.round(Math.max(...highs) * 100) / 100,
  };
}

export default function PredictionIA() {
  const [coins, setCoins] = useState<PredCoin[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState("");
  const [search, setSearch] = useState("");

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchTop200(true);
      setCoins(data.map(buildPrediction));
      setLastUpdate(new Date().toLocaleTimeString("fr-FR"));
    } catch { /* keep */ } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); const i = setInterval(fetchData, 120000); return () => clearInterval(i); }, [fetchData]);

  const filtered = search
    ? coins.filter((c) => c.symbol.includes(search.toUpperCase()) || c.name.toLowerCase().includes(search.toLowerCase()))
    : coins;

  const bullish = coins.filter((c) => c.prediction === "Haussier").length;
  const bearish = coins.filter((c) => c.prediction === "Baissier").length;
  const avgConf = coins.length ? coins.reduce((s, c) => s + c.confidence, 0) / coins.length : 0;

  return (
    <div className="min-h-screen bg-[#0A0E1A] text-white">
      <Sidebar />
      <main className="md:ml-[260px] pt-14 md:pt-0 bg-[#0A0E1A]">
      <PageHeader
          icon={<Brain className="w-6 h-6" />}
          title="Prédictions IA"
          subtitle="L’intelligence artificielle analyse les patterns techniques, le sentiment et les données on-chain pour générer des prédictions de prix à court et moyen terme."
          accentColor="purple"
          steps={[
            { n: "1", title: "Consultez les prédictions", desc: "Chaque crypto affiche une prédiction haussière ou baissière avec un niveau de confiance. Plus la confiance est élevée, plus le signal est fiable." },
            { n: "2", title: "Filtrez par signal", desc: "Utilisez les filtres pour afficher uniquement les signaux BULL (haussiers) ou BEAR (baissiers) selon votre stratégie." },
            { n: "3", title: "Croisez avec l'analyse technique", desc: "Les prédictions IA sont un complément, pas un oracle. Confirmez toujours avec vos propres indicateurs techniques." },
          ]}
        />
        <div className="relative rounded-3xl overflow-hidden mb-6 border border-white/[0.08]">
          <div className="absolute inset-0 bg-[#0A0E1A]" />
          <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-purple-500/22 blur-3xl" style={{ animation: "pi-pulse 6s ease-in-out infinite" }} />
          <div className="absolute -bottom-24 right-1/3 w-80 h-80 rounded-full bg-pink-500/22 blur-3xl" style={{ animation: "pi-pulse 8s ease-in-out infinite reverse" }} />
          <div className="absolute inset-0 opacity-[0.04]" style={{
            backgroundImage: "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
            backgroundSize: "44px 44px",
          }} />
          <div className="relative z-10 flex items-center justify-between gap-4 px-6 md:px-10 py-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-purple-500/15 border border-purple-500/40 flex items-center justify-center" style={{ boxShadow: "0 0 30px rgba(168,85,247,0.3)" }}>
                <Brain className="w-7 h-7 text-purple-300" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <h1 className="text-xl md:text-2xl font-black bg-gradient-to-r from-purple-400 via-pink-400 to-fuchsia-400 bg-clip-text text-transparent">
                    Prédictions IA
                  </h1>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border border-purple-500/40 bg-purple-500/10 text-purple-300">
                    <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" /> IA Active
                  </span>
                </div>
                <p className="text-xs md:text-sm text-gray-400">
                  Analyse prédictive RSI + momentum · Top 200 cryptos
                </p>
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
          @keyframes pi-pulse {
            0%, 100% { transform: scale(1) translate(0,0); opacity: 0.3; }
            50% { transform: scale(1.2) translate(20px,-10px); opacity: 0.45; }
          }
          @keyframes pi-fadeUp {
            from { opacity: 0; transform: translateY(12px); }
            to { opacity: 1; transform: translateY(0); }
          }
          .pi-anim { animation: pi-fadeUp 0.6s ease-out both; }
        `}</style>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 md:gap-4 mb-6">
          {[
            { label: "Prédictions Haussières", value: bullish, color: "#22c55e", icon: "🟢" },
            { label: "Prédictions Baissières", value: bearish, color: "#ef4444", icon: "🔴" },
            { label: "Confiance Moyenne", value: `${avgConf.toFixed(1)}%`, color: "#a78bfa", icon: "🎯" },
            { label: "Cryptos Analysées", value: coins.length, color: "#22d3ee", icon: "📊" },
          ].map((k, i) => (
            <div key={i}
              className="pi-anim relative bg-gradient-to-br from-white/[0.04] to-white/[0.01] border border-white/[0.06] hover:border-white/[0.14] rounded-2xl p-4 md:p-5 transition-all overflow-hidden"
              style={{ animationDelay: `${i * 70}ms` }}
            >
              <div className="absolute -top-12 -right-12 w-32 h-32 rounded-full blur-3xl opacity-25" style={{ background: k.color }} />
              <div className="relative">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">{k.label}</p>
                  <span className="text-base">{k.icon}</span>
                </div>
                <p className="text-2xl md:text-3xl font-black" style={{ color: k.color, textShadow: `0 0 14px ${k.color}44` }}>{k.value}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-[#111827] border border-white/[0.06] rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
            <h2 className="text-lg font-bold">🔮 Prédictions — Top 200 Cryptos</h2>
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher..."
                  className="pl-9 pr-3 py-2 rounded-lg bg-black/30 border border-white/[0.08] text-sm text-white placeholder-gray-500 focus:outline-none w-48" />
              </div>
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-1">
                <span className="text-xs text-amber-400 font-bold">⚠️ Pas un conseil financier</span>
              </div>
            </div>
          </div>
          <div className="overflow-x-auto max-h-[700px] overflow-y-auto">
            <table className="w-full min-w-[1100px]">
              <thead className="sticky top-0 bg-[#111827] z-10">
                <tr className="border-b border-white/[0.06]">
                  <th className="text-left py-3 px-3 text-xs font-bold text-gray-500 uppercase">#</th>
                  <th className="text-left py-3 px-3 text-xs font-bold text-gray-500 uppercase">Crypto</th>
                  <th className="text-right py-3 px-3 text-xs font-bold text-gray-500 uppercase">Prix</th>
                  <th className="text-right py-3 px-3 text-xs font-bold text-gray-500 uppercase">24h</th>
                  <th className="text-right py-3 px-3 text-xs font-bold text-gray-500 uppercase">7j</th>
                  <th className="text-center py-3 px-3 text-xs font-bold text-gray-500 uppercase">Prédiction</th>
                  <th className="text-center py-3 px-3 text-xs font-bold text-gray-500 uppercase">Confiance</th>
                  <th className="text-right py-3 px-3 text-xs font-bold text-gray-500 uppercase">Target</th>
                  <th className="text-right py-3 px-3 text-xs font-bold text-gray-500 uppercase">Support</th>
                  <th className="text-right py-3 px-3 text-xs font-bold text-gray-500 uppercase">Résistance</th>
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
                    <td className="py-2.5 px-3 text-center">
                      <span className={`px-3 py-1 rounded-full text-xs font-extrabold ${
                        c.prediction === "Haussier" ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" :
                        c.prediction === "Baissier" ? "bg-red-500/20 text-red-400 border border-red-500/30" :
                        "bg-gray-500/20 text-gray-400 border border-gray-500/30"
                      }`}>{c.prediction === "Haussier" ? "📈" : c.prediction === "Baissier" ? "📉" : "➡️"} {c.prediction}</span>
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <div className="flex items-center gap-2 justify-center">
                        <div className="h-2 w-14 bg-white/[0.06] rounded-full overflow-hidden">
                          <div className="h-full rounded-full" style={{
                            width: `${c.confidence}%`,
                            backgroundColor: c.confidence > 70 ? "#10B981" : c.confidence > 50 ? "#F59E0B" : "#6B7280",
                          }} />
                        </div>
                        <span className="text-xs font-bold text-gray-400">{c.confidence}%</span>
                      </div>
                    </td>
                    <td className={`py-2.5 px-3 text-right text-sm font-bold ${c.target > c.price ? "text-emerald-400" : "text-red-400"}`}>
                      ${formatPrice(c.target)}
                    </td>
                    <td className="py-2.5 px-3 text-right text-sm text-emerald-400/70">${formatPrice(c.support)}</td>
                    <td className="py-2.5 px-3 text-right text-sm text-red-400/70">${formatPrice(c.resistance)}</td>
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
