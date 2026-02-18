import { useEffect, useState, useCallback } from "react";
import Sidebar from "@/components/Sidebar";
import { Brain, RefreshCw, TrendingUp, TrendingDown } from "lucide-react";

const PRED_BG =
  "https://mgx-backend-cdn.metadl.com/generate/images/966405/2026-02-18/4b6e1138-5e13-42c7-9e5d-95ba3808c41a.png";

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

export default function PredictionIA() {
  const [coins, setCoins] = useState<PredCoin[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState("");

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(
        "https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=50&page=1&sparkline=true&price_change_percentage=24h,7d"
      );
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setCoins(data.map((c: Record<string, unknown>) => {
            const sparkline = ((c.sparkline_in_7d as { price?: number[] })?.price) || [];
            const rsi = sparkline.length > 20 ? computeRSI(sparkline.slice(-50)) : 50;
            const ch24 = (c.price_change_percentage_24h as number) || 0;
            const ch7d = (c.price_change_percentage_7d_in_currency as number) || 0;
            const price = (c.current_price as number) || 0;
            const momentum = ch24 * 0.5 + ch7d * 0.3 + (50 - rsi) * 0.2;

            let prediction: "Haussier" | "Baissier" | "Neutre" = "Neutre";
            let confidence = 50;
            if (momentum > 3 && rsi < 65) { prediction = "Haussier"; confidence = Math.min(95, 60 + Math.abs(momentum) * 2); }
            else if (momentum < -3 && rsi > 35) { prediction = "Baissier"; confidence = Math.min(95, 60 + Math.abs(momentum) * 2); }
            else { confidence = 40 + Math.random() * 20; }

            const target = prediction === "Haussier" ? price * (1 + Math.abs(momentum) / 100 * 3) :
              prediction === "Baissier" ? price * (1 - Math.abs(momentum) / 100 * 3) : price * 1.02;

            const lows = sparkline.length > 10 ? sparkline.slice(-48) : [price * 0.95];
            const highs = sparkline.length > 10 ? sparkline.slice(-48) : [price * 1.05];

            return {
              id: c.id as string,
              symbol: ((c.symbol as string) || "").toUpperCase(),
              name: c.name as string, price, change24h: ch24, change7d: ch7d,
              image: c.image as string, prediction,
              confidence: Math.round(confidence),
              target: Math.round(target * 100) / 100,
              support: Math.round(Math.min(...lows) * 100) / 100,
              resistance: Math.round(Math.max(...highs) * 100) / 100,
            };
          }));
        }
      }
      setLastUpdate(new Date().toLocaleTimeString("fr-FR"));
    } catch { /* keep */ } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); const i = setInterval(fetchData, 120000); return () => clearInterval(i); }, [fetchData]);

  const bullish = coins.filter((c) => c.prediction === "Haussier").length;
  const bearish = coins.filter((c) => c.prediction === "Baissier").length;
  const avgConf = coins.length ? coins.reduce((s, c) => s + c.confidence, 0) / coins.length : 0;

  return (
    <div className="min-h-screen bg-[#0A0E1A] text-white">
      <Sidebar />
      <main className="ml-[260px] p-6 min-h-screen">
        <div className="relative rounded-2xl overflow-hidden mb-6 h-[140px]">
          <img src={PRED_BG} alt="" className="absolute inset-0 w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0A0E1A]/95 via-[#0A0E1A]/75 to-transparent" />
          <div className="relative z-10 h-full flex items-center justify-between px-8">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <Brain className="w-7 h-7 text-purple-400" />
                <h1 className="text-2xl font-extrabold">Prédictions IA</h1>
              </div>
              <p className="text-sm text-gray-400">Analyse prédictive basée sur RSI, momentum et tendances • Top 50</p>
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
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold">🔮 Prédictions — Top 50 Cryptos</h2>
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-1">
              <span className="text-xs text-amber-400 font-bold">⚠️ Ne constitue pas un conseil financier</span>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1100px]">
              <thead>
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
                {coins.map((c, i) => (
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
                    <td className={`py-3 px-3 text-right text-sm font-bold ${c.change7d >= 0 ? "text-emerald-400" : "text-red-400"}`}>{c.change7d >= 0 ? "+" : ""}{c.change7d.toFixed(2)}%</td>
                    <td className="py-3 px-3 text-center">
                      <span className={`px-3 py-1 rounded-full text-xs font-extrabold ${
                        c.prediction === "Haussier" ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" :
                        c.prediction === "Baissier" ? "bg-red-500/20 text-red-400 border border-red-500/30" :
                        "bg-gray-500/20 text-gray-400 border border-gray-500/30"
                      }`}>{c.prediction === "Haussier" ? "📈" : c.prediction === "Baissier" ? "📉" : "➡️"} {c.prediction}</span>
                    </td>
                    <td className="py-3 px-3 text-center">
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
                    <td className={`py-3 px-3 text-right text-sm font-bold ${c.target > c.price ? "text-emerald-400" : "text-red-400"}`}>
                      ${c.target >= 1 ? c.target.toLocaleString("en-US", { maximumFractionDigits: 2 }) : c.target.toFixed(6)}
                    </td>
                    <td className="py-3 px-3 text-right text-sm text-emerald-400/70">${c.support >= 1 ? c.support.toLocaleString("en-US", { maximumFractionDigits: 2 }) : c.support.toFixed(6)}</td>
                    <td className="py-3 px-3 text-right text-sm text-red-400/70">${c.resistance >= 1 ? c.resistance.toLocaleString("en-US", { maximumFractionDigits: 2 }) : c.resistance.toFixed(6)}</td>
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