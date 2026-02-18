import { useEffect, useState, useCallback } from "react";
import Sidebar from "@/components/Sidebar";
import { BarChart3, RefreshCw, TrendingUp, TrendingDown, Target, Shield, Zap } from "lucide-react";

const STRAT_BG =
  "https://mgx-backend-cdn.metadl.com/generate/images/966405/2026-02-18/b3c0b3a0-ae42-46d0-9f3a-9f12780c9e10.png";

interface CoinSignal {
  symbol: string;
  name: string;
  price: number;
  change24h: number;
  rsi: number;
  signal: "BUY" | "SELL" | "HOLD";
  strength: number;
  image: string;
}

function computeRSI(prices: number[], period = 14): number {
  if (prices.length < period + 1) return 50;
  const gains: number[] = [];
  const losses: number[] = [];
  for (let i = 1; i <= period; i++) {
    const change = prices[i] - prices[i - 1];
    gains.push(Math.max(0, change));
    losses.push(Math.max(0, -change));
  }
  let avgGain = gains.reduce((a, b) => a + b, 0) / period;
  let avgLoss = losses.reduce((a, b) => a + b, 0) / period;
  for (let i = period + 1; i < prices.length; i++) {
    const change = prices[i] - prices[i - 1];
    avgGain = (avgGain * (period - 1) + Math.max(0, change)) / period;
    avgLoss = (avgLoss * (period - 1) + Math.max(0, -change)) / period;
  }
  if (avgLoss === 0) return 100;
  return 100 - 100 / (1 + avgGain / avgLoss);
}

const TOP_SYMBOLS = [
  "bitcoin", "ethereum", "solana", "binancecoin", "ripple", "cardano", "dogecoin",
  "avalanche-2", "polkadot", "chainlink", "polygon-ecosystem-token", "uniswap",
  "litecoin", "near", "internet-computer", "stellar", "aptos", "filecoin",
  "arbitrum", "optimism", "injective-protocol", "sui", "sei-network", "celestia",
  "render-token", "the-graph", "aave", "maker", "lido-dao", "rocket-pool",
];

export default function Strategy() {
  const [signals, setSignals] = useState<CoinSignal[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState("");

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const coinsRes = await fetch(
        "https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=50&page=1&sparkline=true&price_change_percentage=24h"
      );
      if (coinsRes.ok) {
        const data = await coinsRes.json();
        if (Array.isArray(data)) {
          const sigs: CoinSignal[] = data.map((c: Record<string, unknown>) => {
            const sparkline = (c.sparkline_in_7d as { price?: number[] })?.price || [];
            const rsi = sparkline.length > 20 ? computeRSI(sparkline.slice(-50)) : 50;
            const ch = (c.price_change_percentage_24h as number) || 0;

            let signal: "BUY" | "SELL" | "HOLD" = "HOLD";
            let strength = 50;
            if (rsi < 30 && ch > -5) { signal = "BUY"; strength = Math.round(80 + (30 - rsi)); }
            else if (rsi < 40 && ch > 0) { signal = "BUY"; strength = Math.round(60 + (40 - rsi)); }
            else if (rsi > 70 && ch < 5) { signal = "SELL"; strength = Math.round(80 + (rsi - 70)); }
            else if (rsi > 60 && ch < 0) { signal = "SELL"; strength = Math.round(60 + (rsi - 60)); }
            else { strength = Math.round(40 + Math.abs(50 - rsi)); }

            return {
              symbol: ((c.symbol as string) || "").toUpperCase(),
              name: c.name as string,
              price: (c.current_price as number) || 0,
              change24h: ch,
              rsi: Math.round(rsi * 10) / 10,
              signal,
              strength: Math.min(100, strength),
              image: c.image as string,
            };
          });
          setSignals(sigs);
        }
      }
      setLastUpdate(new Date().toLocaleTimeString("fr-FR"));
    } catch {
      // keep existing
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 120000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const buySignals = signals.filter((s) => s.signal === "BUY");
  const sellSignals = signals.filter((s) => s.signal === "SELL");
  const holdSignals = signals.filter((s) => s.signal === "HOLD");
  const avgRSI = signals.length ? signals.reduce((s, c) => s + c.rsi, 0) / signals.length : 50;

  const strategies = [
    { name: "DCA Hebdomadaire", type: "Long Terme", risk: "Faible", desc: "Achat régulier chaque semaine sur les top cryptos", icon: <Shield className="w-5 h-5 text-emerald-400" />, coins: buySignals.slice(0, 5).map((s) => s.symbol).join(", ") || "BTC, ETH, SOL" },
    { name: "Swing Trading", type: "Moyen Terme", risk: "Moyen", desc: "Trading sur les supports/résistances avec RSI", icon: <TrendingUp className="w-5 h-5 text-cyan-400" />, coins: signals.filter((s) => s.rsi < 40 || s.rsi > 60).slice(0, 5).map((s) => s.symbol).join(", ") || "ETH, SOL, AVAX" },
    { name: "Breakout Trading", type: "Court Terme", risk: "Élevé", desc: "Entrée sur cassure de résistance avec volume", icon: <Zap className="w-5 h-5 text-amber-400" />, coins: signals.filter((s) => s.change24h > 3).slice(0, 5).map((s) => s.symbol).join(", ") || "SOL, DOGE, AVAX" },
    { name: "RSI Oversold", type: "Court Terme", risk: "Moyen", desc: "Achat quand RSI < 30 (survendu)", icon: <Target className="w-5 h-5 text-purple-400" />, coins: signals.filter((s) => s.rsi < 35).slice(0, 5).map((s) => s.symbol).join(", ") || "Aucun signal actuellement" },
  ];

  return (
    <div className="min-h-screen bg-[#0A0E1A] text-white">
      <Sidebar />
      <main className="ml-[260px] p-6 min-h-screen">
        {/* Hero */}
        <div className="relative rounded-2xl overflow-hidden mb-6 h-[140px]">
          <img src={STRAT_BG} alt="" className="absolute inset-0 w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0A0E1A]/95 via-[#0A0E1A]/75 to-transparent" />
          <div className="relative z-10 h-full flex items-center justify-between px-8">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <BarChart3 className="w-7 h-7 text-indigo-400" />
                <h1 className="text-2xl font-extrabold">Stratégies de Trading</h1>
              </div>
              <p className="text-sm text-gray-400">Signaux RSI automatiques • Top 50 cryptos • Stratégies recommandées</p>
            </div>
            <button onClick={fetchData} disabled={loading}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/[0.08] hover:bg-white/[0.12] border border-white/[0.08] text-sm font-semibold transition-all">
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
              {lastUpdate ? `MAJ ${lastUpdate}` : "Rafraîchir"}
            </button>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-5 gap-4 mb-6">
          <div className="bg-[#111827] border border-white/[0.06] rounded-2xl p-5">
            <p className="text-xs text-gray-500 font-semibold mb-1">Signaux BUY</p>
            <p className="text-2xl font-extrabold text-emerald-400">{buySignals.length}</p>
          </div>
          <div className="bg-[#111827] border border-white/[0.06] rounded-2xl p-5">
            <p className="text-xs text-gray-500 font-semibold mb-1">Signaux SELL</p>
            <p className="text-2xl font-extrabold text-red-400">{sellSignals.length}</p>
          </div>
          <div className="bg-[#111827] border border-white/[0.06] rounded-2xl p-5">
            <p className="text-xs text-gray-500 font-semibold mb-1">Signaux HOLD</p>
            <p className="text-2xl font-extrabold text-gray-400">{holdSignals.length}</p>
          </div>
          <div className="bg-[#111827] border border-white/[0.06] rounded-2xl p-5">
            <p className="text-xs text-gray-500 font-semibold mb-1">RSI Moyen</p>
            <p className="text-2xl font-extrabold text-indigo-400">{avgRSI.toFixed(1)}</p>
          </div>
          <div className="bg-[#111827] border border-white/[0.06] rounded-2xl p-5">
            <p className="text-xs text-gray-500 font-semibold mb-1">Cryptos Analysées</p>
            <p className="text-2xl font-extrabold">{signals.length}</p>
          </div>
        </div>

        {/* Strategies */}
        <div className="bg-[#111827] border border-white/[0.06] rounded-2xl p-6 mb-6">
          <h2 className="text-lg font-bold mb-4">🎯 Stratégies Recommandées</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {strategies.map((s, i) => (
              <div key={i} className="bg-black/20 rounded-xl p-5 border border-white/[0.04] hover:border-white/[0.1] transition-all">
                <div className="flex items-center gap-3 mb-3">
                  {s.icon}
                  <div>
                    <h3 className="font-bold">{s.name}</h3>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-400 font-bold">{s.type}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                        s.risk === "Faible" ? "bg-emerald-500/20 text-emerald-400" : s.risk === "Moyen" ? "bg-amber-500/20 text-amber-400" : "bg-red-500/20 text-red-400"
                      }`}>{s.risk}</span>
                    </div>
                  </div>
                </div>
                <p className="text-sm text-gray-400 mb-2">{s.desc}</p>
                <p className="text-xs text-gray-500">Cryptos: <span className="text-white font-semibold">{s.coins}</span></p>
              </div>
            ))}
          </div>
        </div>

        {/* Signals Table */}
        <div className="bg-[#111827] border border-white/[0.06] rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold">📊 Signaux — Top 50 Cryptos</h2>
            <span className="text-xs text-gray-500">{signals.length} signaux générés</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px]">
              <thead>
                <tr className="border-b border-white/[0.06]">
                  <th className="text-left py-3 px-3 text-xs font-bold text-gray-500 uppercase">#</th>
                  <th className="text-left py-3 px-3 text-xs font-bold text-gray-500 uppercase">Crypto</th>
                  <th className="text-right py-3 px-3 text-xs font-bold text-gray-500 uppercase">Prix</th>
                  <th className="text-right py-3 px-3 text-xs font-bold text-gray-500 uppercase">24h</th>
                  <th className="text-right py-3 px-3 text-xs font-bold text-gray-500 uppercase">RSI</th>
                  <th className="text-center py-3 px-3 text-xs font-bold text-gray-500 uppercase">Signal</th>
                  <th className="text-center py-3 px-3 text-xs font-bold text-gray-500 uppercase">Force</th>
                </tr>
              </thead>
              <tbody>
                {signals.map((s, i) => (
                  <tr key={s.symbol + i} className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors">
                    <td className="py-3 px-3 text-sm text-gray-500 font-semibold">{i + 1}</td>
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-3">
                        {s.image ? <img src={s.image} alt={s.symbol} className="w-7 h-7 rounded-full" /> : (
                          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-[10px] font-bold">{s.symbol.slice(0, 2)}</div>
                        )}
                        <div>
                          <p className="text-sm font-bold">{s.symbol}</p>
                          <p className="text-[10px] text-gray-500">{s.name}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-right text-sm font-bold">
                      ${s.price >= 1 ? s.price.toLocaleString("en-US", { maximumFractionDigits: 2 }) : s.price.toFixed(6)}
                    </td>
                    <td className={`py-3 px-3 text-right text-sm font-bold ${s.change24h >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                      {s.change24h >= 0 ? "+" : ""}{s.change24h.toFixed(2)}%
                    </td>
                    <td className="py-3 px-3 text-right">
                      <span className={`text-sm font-bold ${s.rsi > 70 ? "text-red-400" : s.rsi < 30 ? "text-emerald-400" : "text-gray-300"}`}>
                        {s.rsi.toFixed(1)}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className={`px-3 py-1 rounded-full text-xs font-extrabold ${
                        s.signal === "BUY" ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" :
                        s.signal === "SELL" ? "bg-red-500/20 text-red-400 border border-red-500/30" :
                        "bg-gray-500/20 text-gray-400 border border-gray-500/30"
                      }`}>{s.signal}</span>
                    </td>
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2 justify-center">
                        <div className="h-2 w-16 bg-white/[0.06] rounded-full overflow-hidden">
                          <div className="h-full rounded-full transition-all" style={{
                            width: `${s.strength}%`,
                            backgroundColor: s.signal === "BUY" ? "#10B981" : s.signal === "SELL" ? "#EF4444" : "#6B7280",
                          }} />
                        </div>
                        <span className="text-xs font-bold text-gray-400">{s.strength}</span>
                      </div>
                    </td>
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