import { useEffect, useState, useCallback } from "react";
import Sidebar from "@/components/Sidebar";
import { Brain, RefreshCw, TrendingUp, TrendingDown, Search } from "lucide-react";
import { fetchTop200, formatPrice, type CoinMarketData } from "@/lib/cryptoApi";

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
      <main className="ml-[260px] p-6 min-h-screen">
        <div className="relative rounded-2xl overflow-hidden mb-6 h-[120px] bg-gradient-to-r from-purple-900/40 to-pink-900/40">
          <div className="absolute inset-0 bg-gradient-to-r from-[#0A0E1A]/90 via-[#0A0E1A]/60 to-transparent" />
          <div className="relative z-10 h-full flex items-center justify-between px-8">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <Brain className="w-7 h-7 text-purple-400" />
                <h1 className="text-2xl font-extrabold">Prédictions IA</h1>
              </div>
              <p className="text-sm text-gray-400">Analyse prédictive RSI + momentum — Top 200 cryptos</p>
            </div>
            <button onClick={fetchData} disabled={loading}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/[0.08] hover:bg-white/[0.12] border border-white/[0.08] text-sm font-semibold transition-all">
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
              {lastUpdate ? `MAJ ${lastUpdate}` : "Rafraîchir"}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
          <div className="bg-[#111827] border border-white/[0.06] rounded-2xl p-5">
            <p className="text-xs text-gray-500 font-semibold mb-1">Prédictions Haussières</p>
            <p className="text-2xl font-extrabold text-emerald-400">{bullish}</p>
          </div>
          <div className="bg-[#111827] border border-white/[0.06] rounded-2xl p-5">
            <p className="text-xs text-gray-500 font-semibold mb-1">Prédictions Baissières</p>
            <p className="text-2xl font-extrabold text-red-400">{bearish}</p>
          </div>
          <div className="bg-[#111827] border border-white/[0.06] rounded-2xl p-5">
            <p className="text-xs text-gray-500 font-semibold mb-1">Confiance Moyenne</p>
            <p className="text-2xl font-extrabold text-purple-400">{avgConf.toFixed(1)}%</p>
          </div>
          <div className="bg-[#111827] border border-white/[0.06] rounded-2xl p-5">
            <p className="text-xs text-gray-500 font-semibold mb-1">Cryptos Analysées</p>
            <p className="text-2xl font-extrabold">{coins.length}</p>
          </div>
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
      </main>
    </div>
  );
}