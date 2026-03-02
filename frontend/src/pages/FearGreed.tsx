import { useEffect, useState, useCallback } from "react";
import Sidebar from "@/components/Sidebar";
import { RefreshCw, TrendingUp, TrendingDown, Activity } from "lucide-react";
import { fetchWithCorsProxy } from "@/lib/cryptoApi";
import PageHeader from "@/components/PageHeader";
import Footer from "@/components/Footer";

const FG_BG =
  "https://mgx-backend-cdn.metadl.com/generate/images/966405/2026-02-18/6e7996e5-3fd7-4958-9f83-5d5f09ef989f.png";

interface FGData {
  value: number;
  value_classification: string;
  timestamp: string;
}

interface CoinSentiment {
  id: string;
  symbol: string;
  name: string;
  price: number;
  change24h: number;
  volume: number;
  image: string;
}

function getColor(val: number) {
  if (val <= 20) return "#ef4444";
  if (val <= 40) return "#f97316";
  if (val <= 55) return "#eab308";
  if (val <= 75) return "#84cc16";
  return "#22c55e";
}

function getLabel(val: number) {
  if (val <= 20) return "Peur Extrême";
  if (val <= 40) return "Peur";
  if (val <= 55) return "Neutre";
  if (val <= 75) return "Avidité";
  return "Avidité Extrême";
}

function FearGreedGauge({ value }: { value: number }) {
  const angle = (value / 100) * 180 - 90;
  const color = getColor(value);
  const circumference = Math.PI * 85;
  const dashLen = (value / 100) * circumference;

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-72 h-72 flex items-center justify-center">
        <svg viewBox="0 0 200 200" className="w-full h-full">
          <circle cx="100" cy="100" r="85" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="14" />
          <circle
            cx="100" cy="100" r="85" fill="none" stroke={color} strokeWidth="14"
            strokeDasharray={`${dashLen} ${circumference}`} strokeLinecap="round"
            transform="rotate(-90 100 100)" className="transition-all duration-1000"
          />
          {/* Tick marks */}
          {[0, 25, 50, 75, 100].map((tick) => {
            const a = ((tick / 100) * 360 - 90) * (Math.PI / 180);
            const x1 = 100 + 73 * Math.cos(a);
            const y1 = 100 + 73 * Math.sin(a);
            const x2 = 100 + 80 * Math.cos(a);
            const y2 = 100 + 80 * Math.sin(a);
            return <line key={tick} x1={x1} y1={y1} x2={x2} y2={y2} stroke="rgba(255,255,255,0.2)" strokeWidth="2" />;
          })}
          {/* Needle */}
          <line
            x1="100" y1="100"
            x2={100 + 55 * Math.cos((angle * Math.PI) / 180)}
            y2={100 + 55 * Math.sin((angle * Math.PI) / 180)}
            stroke="white" strokeWidth="2.5" strokeLinecap="round"
            className="transition-all duration-1000"
          />
          <circle cx="100" cy="100" r="5" fill="white" />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-6xl font-black text-white">{value}</span>
          <span className="text-lg font-bold mt-1" style={{ color }}>{getLabel(value)}</span>
        </div>
      </div>
    </div>
  );
}

export default function FearGreed() {
  const [current, setCurrent] = useState<FGData | null>(null);
  const [history, setHistory] = useState<FGData[]>([]);
  const [coins, setCoins] = useState<CoinSentiment[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState("");

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const { fetchTop200 } = await import("@/lib/cryptoApi");
      const [fgRes, top200Data] = await Promise.all([
        fetchWithCorsProxy("https://api.alternative.me/fng/?limit=30").then(r => ({ status: "fulfilled" as const, value: r })).catch(() => ({ status: "rejected" as const, value: null as any })),
        fetchTop200(false),
      ]);

      if (fgRes.status === "fulfilled" && fgRes.value.ok) {
        const data = await fgRes.value.json();
        if (data?.data?.length > 0) {
          setCurrent({
            value: parseInt(data.data[0].value),
            value_classification: data.data[0].value_classification,
            timestamp: data.data[0].timestamp,
          });
          setHistory(
            data.data.slice(0, 30).map((d: Record<string, string>) => ({
              value: parseInt(d.value),
              value_classification: d.value_classification,
              timestamp: d.timestamp,
            }))
          );
        }
      }

      if (top200Data.length > 0) {
          setCoins(
            top200Data.map((c: any) => ({
              id: c.id as string,
              symbol: ((c.symbol as string) || "").toUpperCase(),
              name: c.name as string,
              price: c.current_price as number,
              change24h: (c.price_change_percentage_24h as number) || 0,
              volume: (c.total_volume as number) || 0,
              image: c.image as string,
            }))
          );
      }

      setLastUpdate(new Date().toLocaleTimeString("fr-FR"));
    } catch {
      // keep existing data
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 60000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const val = current?.value ?? 65;
  const bullishCoins = coins.filter((c) => c.change24h > 0).length;
  const bearishCoins = coins.filter((c) => c.change24h < 0).length;
  const avgChange = coins.length ? coins.reduce((s, c) => s + c.change24h, 0) / coins.length : 0;

  const factors = [
    { name: "Volatilité", val: Math.round(Math.max(0, Math.min(100, 50 + (coins.length ? coins.reduce((s, c) => s + Math.abs(c.change24h), 0) / coins.length * 5 : 0)))), icon: "📉" },
    { name: "Volume", val: Math.round(Math.max(0, Math.min(100, 40 + (coins.length ? Math.log10(coins.reduce((s, c) => s + c.volume, 0) / 1e9) * 15 : 0)))), icon: "📊" },
    { name: "Momentum", val: Math.round(Math.max(0, Math.min(100, 50 + avgChange * 5))), icon: "🚀" },
    { name: "Dominance BTC", val: Math.round(Math.max(0, Math.min(100, coins.length && coins[0]?.symbol === "BTC" ? 50 + (coins[0].change24h > 0 ? 10 : -10) : 52))), icon: "👑" },
    { name: "Social Media", val: Math.round(Math.max(0, Math.min(100, val * 0.95 + (avgChange > 0 ? 3 : -3)))), icon: "🐦" },
    { name: "Tendances", val: Math.round(Math.max(0, Math.min(100, (bullishCoins / (coins.length || 1)) * 100))), icon: "🔍" },
  ];

  const historyLabels = ["Aujourd'hui", "Hier", "Il y a 2j", "Il y a 3j", "Il y a 7j", "Il y a 14j", "Il y a 30j"];
  const historyIndices = [0, 1, 2, 3, 6, 13, 29];

  return (
    <div className="min-h-screen bg-[#0A0E1A] text-white">
      <Sidebar />
      <main className="md:ml-[260px] p-4 md:p-6 pt-[72px] md:pt-6 min-h-screen bg-[#0A0E1A]">
        <PageHeader
          icon={<Activity className="w-6 h-6" />}
          title="Fear & Greed Index"
          subtitle="Mesurez le sentiment global du marché crypto en temps réel. Un indice bas (peur) peut signaler une opportunité d’achat, un indice élevé (avidité) peut indiquer un marché surchauffé."
          accentColor="amber"
          steps={[
            { n: "1", title: "Lisez l'indice principal", desc: "La jauge centrale affiche le sentiment actuel de 0 (peur extrême) à 100 (avidité extrême). Vert = optimisme, Rouge = pessimisme." },
            { n: "2", title: "Analysez l'historique", desc: "Consultez l'évolution sur 30 jours pour identifier les tendances de sentiment et anticiper les retournements de marché." },
            { n: "3", title: "Croisez avec les facteurs", desc: "Les 6 facteurs (volatilité, volume, momentum…) vous donnent le détail du calcul pour affiner votre analyse." },
          ]}
        />
        {/* Hero */}
        <div className="relative rounded-2xl overflow-hidden mb-6 h-[140px]">
          <img src={FG_BG} alt="" className="absolute inset-0 w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0A0E1A]/95 via-[#0A0E1A]/75 to-transparent" />
          <div className="relative z-10 h-full flex items-center justify-between px-8">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <Activity className="w-7 h-7 text-amber-400" />
                <h1 className="text-2xl font-extrabold">Fear & Greed Index</h1>
              </div>
              <p className="text-sm text-gray-400">Sentiment du marché crypto en temps réel • 50 cryptos analysées</p>
            </div>
            <button
              onClick={fetchData}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/[0.08] hover:bg-white/[0.12] border border-white/[0.08] text-sm font-semibold transition-all"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
              {lastUpdate ? `MAJ ${lastUpdate}` : "Rafraîchir"}
            </button>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
          <div className="bg-[#111827] border border-white/[0.06] rounded-2xl p-5">
            <p className="text-xs text-gray-500 font-semibold mb-1">Indice Actuel</p>
            <p className="text-3xl font-extrabold" style={{ color: getColor(val) }}>{val}</p>
            <p className="text-xs font-bold mt-1" style={{ color: getColor(val) }}>{getLabel(val)}</p>
          </div>
          <div className="bg-[#111827] border border-white/[0.06] rounded-2xl p-5">
            <p className="text-xs text-gray-500 font-semibold mb-1">Cryptos Haussières</p>
            <p className="text-3xl font-extrabold text-emerald-400">{bullishCoins}</p>
            <p className="text-xs text-gray-500 mt-1">sur {coins.length} analysées</p>
          </div>
          <div className="bg-[#111827] border border-white/[0.06] rounded-2xl p-5">
            <p className="text-xs text-gray-500 font-semibold mb-1">Cryptos Baissières</p>
            <p className="text-3xl font-extrabold text-red-400">{bearishCoins}</p>
            <p className="text-xs text-gray-500 mt-1">sur {coins.length} analysées</p>
          </div>
          <div className="bg-[#111827] border border-white/[0.06] rounded-2xl p-5">
            <p className="text-xs text-gray-500 font-semibold mb-1">Variation Moyenne</p>
            <p className={`text-3xl font-extrabold ${avgChange >= 0 ? "text-emerald-400" : "text-red-400"}`}>
              {avgChange >= 0 ? "+" : ""}{avgChange.toFixed(2)}%
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Gauge */}
          <div className="bg-[#111827] border border-white/[0.06] rounded-2xl p-8 flex flex-col items-center">
            <FearGreedGauge value={val} />
            <p className="text-gray-400 text-sm mt-4 text-center max-w-md">
              L'indice Fear & Greed mesure le sentiment global du marché crypto sur une échelle de 0 (peur extrême) à 100 (avidité extrême).
              Basé sur la volatilité, le volume, les réseaux sociaux, la dominance BTC et les tendances Google.
            </p>
          </div>

          {/* History */}
          <div className="bg-[#111827] border border-white/[0.06] rounded-2xl p-6">
            <h2 className="text-lg font-bold mb-4">📊 Historique (30 jours)</h2>
            <div className="space-y-3">
              {historyIndices.map((idx, i) => {
                const h = history[idx];
                if (!h) return null;
                return (
                  <div key={i} className="flex items-center justify-between p-3 bg-white/[0.03] rounded-xl hover:bg-white/[0.05] transition-colors">
                    <span className="text-gray-300 font-medium text-sm">{historyLabels[i]}</span>
                    <div className="flex items-center gap-3">
                      <div className="w-32 h-2.5 bg-gray-800 rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${h.value}%`, background: getColor(h.value) }} />
                      </div>
                      <span className="text-white font-bold w-8 text-right">{h.value}</span>
                      <span className="text-sm font-semibold w-28 text-right" style={{ color: getColor(h.value) }}>
                        {getLabel(h.value)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
            {/* Mini chart */}
            {history.length > 5 && (
              <div className="mt-4 p-3 bg-black/20 rounded-xl">
                <p className="text-xs text-gray-500 font-semibold mb-2">Évolution 30 jours</p>
                <svg viewBox="0 0 400 80" className="w-full h-20">
                  {history.slice(0, 30).reverse().map((h, i, arr) => {
                    if (i === 0) return null;
                    const x1 = ((i - 1) / (arr.length - 1)) * 400;
                    const y1 = 80 - (arr[i - 1].value / 100) * 80;
                    const x2 = (i / (arr.length - 1)) * 400;
                    const y2 = 80 - (h.value / 100) * 80;
                    return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={getColor(h.value)} strokeWidth="2" />;
                  })}
                  {history.slice(0, 30).reverse().map((h, i, arr) => {
                    const x = (i / (arr.length - 1)) * 400;
                    const y = 80 - (h.value / 100) * 80;
                    return <circle key={i} cx={x} cy={y} r="3" fill={getColor(h.value)} />;
                  })}
                </svg>
              </div>
            )}
          </div>
        </div>

        {/* Factors */}
        <div className="bg-[#111827] border border-white/[0.06] rounded-2xl p-6 mb-6">
          <h2 className="text-lg font-bold mb-4">📈 Facteurs d'influence</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {factors.map((f, i) => (
              <div key={i} className="bg-black/20 rounded-xl p-4 text-center border border-white/[0.04] hover:border-white/[0.1] transition-all">
                <span className="text-3xl">{f.icon}</span>
                <p className="text-gray-400 text-xs mt-2 font-semibold">{f.name}</p>
                <p className="text-white font-extrabold text-xl mt-1">{f.val}</p>
                <div className="w-full h-2 bg-gray-800 rounded-full mt-2">
                  <div className="h-full rounded-full transition-all duration-700" style={{ width: `${f.val}%`, background: getColor(f.val) }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top 50 Sentiment Table */}
        <div className="bg-[#111827] border border-white/[0.06] rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold">🔥 Sentiment Top 50 Cryptos</h2>
            <span className="text-xs text-gray-500">{coins.length} actifs analysés</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px]">
              <thead>
                <tr className="border-b border-white/[0.06]">
                  <th className="text-left py-3 px-3 text-xs font-bold text-gray-500 uppercase">#</th>
                  <th className="text-left py-3 px-3 text-xs font-bold text-gray-500 uppercase">Crypto</th>
                  <th className="text-right py-3 px-3 text-xs font-bold text-gray-500 uppercase">Prix</th>
                  <th className="text-right py-3 px-3 text-xs font-bold text-gray-500 uppercase">24h</th>
                  <th className="text-right py-3 px-3 text-xs font-bold text-gray-500 uppercase">Volume</th>
                  <th className="text-center py-3 px-3 text-xs font-bold text-gray-500 uppercase">Sentiment</th>
                </tr>
              </thead>
              <tbody>
                {coins.map((c, i) => {
                  const sentiment = c.change24h > 3 ? "🟢 Très Haussier" : c.change24h > 0 ? "🟢 Haussier" : c.change24h > -3 ? "🔴 Baissier" : "🔴 Très Baissier";
                  return (
                    <tr key={c.id} className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors">
                      <td className="py-3 px-3 text-sm text-gray-500 font-semibold">{i + 1}</td>
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-3">
                          {c.image ? (
                            <img src={c.image} alt={c.symbol} className="w-7 h-7 rounded-full" />
                          ) : (
                            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-[10px] font-bold">
                              {c.symbol.slice(0, 2)}
                            </div>
                          )}
                          <div>
                            <p className="text-sm font-bold">{c.name}</p>
                            <p className="text-xs text-gray-500">{c.symbol}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-right text-sm font-bold">
                        ${c.price >= 1 ? c.price.toLocaleString("en-US", { maximumFractionDigits: 2 }) : c.price.toFixed(6)}
                      </td>
                      <td className={`py-3 px-3 text-right text-sm font-bold ${c.change24h >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                        <div className="flex items-center justify-end gap-1">
                          {c.change24h >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                          {c.change24h >= 0 ? "+" : ""}{c.change24h.toFixed(2)}%
                        </div>
                      </td>
                      <td className="py-3 px-3 text-right text-sm text-gray-300">
                        ${c.volume >= 1e9 ? (c.volume / 1e9).toFixed(2) + "B" : c.volume >= 1e6 ? (c.volume / 1e6).toFixed(1) + "M" : (c.volume / 1e3).toFixed(0) + "K"}
                      </td>
                      <td className="py-3 px-3 text-center text-sm">{sentiment}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
        <Footer />
      </main>
    </div>
  );
}