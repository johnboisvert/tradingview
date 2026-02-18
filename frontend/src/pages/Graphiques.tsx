import { useEffect, useState, useCallback, useMemo } from "react";
import Sidebar from "@/components/Sidebar";
import { LineChart, RefreshCw, TrendingUp, TrendingDown } from "lucide-react";

interface CoinData {
  id: string;
  symbol: string;
  name: string;
  price: number;
  change24h: number;
  image: string;
  sparkline: number[];
}

/* ─── Helpers ─── */
function computeRSI(data: number[], period = 14): number[] {
  const rsi: number[] = [];
  if (data.length < period + 1) return data.map(() => 50);
  let avgGain = 0;
  let avgLoss = 0;
  for (let i = 1; i <= period; i++) {
    const diff = data[i] - data[i - 1];
    if (diff > 0) avgGain += diff;
    else avgLoss += Math.abs(diff);
  }
  avgGain /= period;
  avgLoss /= period;
  for (let i = 0; i < period; i++) rsi.push(50);
  rsi.push(avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss));
  for (let i = period + 1; i < data.length; i++) {
    const diff = data[i] - data[i - 1];
    const gain = diff > 0 ? diff : 0;
    const loss = diff < 0 ? Math.abs(diff) : 0;
    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;
    rsi.push(avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss));
  }
  return rsi;
}

function computeEMA(data: number[], period: number): number[] {
  const ema: number[] = [];
  if (data.length === 0) return ema;
  const k = 2 / (period + 1);
  ema.push(data[0]);
  for (let i = 1; i < data.length; i++) {
    ema.push(data[i] * k + ema[i - 1] * (1 - k));
  }
  return ema;
}

function computeMACD(data: number[]): { macd: number[]; signal: number[]; histogram: number[] } {
  const ema12 = computeEMA(data, 12);
  const ema26 = computeEMA(data, 26);
  const macdLine = ema12.map((v, i) => v - ema26[i]);
  const signalLine = computeEMA(macdLine, 9);
  const histogram = macdLine.map((v, i) => v - signalLine[i]);
  return { macd: macdLine, signal: signalLine, histogram };
}

/* ─── Chart Components ─── */
function PriceChart({ data, ema20, ema50, width = 700, height = 300 }: { data: number[]; ema20: number[]; ema50: number[]; width?: number; height?: number }) {
  if (!data || data.length < 2) return null;
  const min = Math.min(...data) * 0.999;
  const max = Math.max(...data) * 1.001;
  const range = max - min || 1;
  const toY = (v: number) => height - 20 - ((v - min) / range) * (height - 40);
  const toX = (i: number) => (i / (data.length - 1)) * width;

  const pricePath = data.map((v, i) => `${i === 0 ? "M" : "L"}${toX(i)},${toY(v)}`).join(" ");
  const ema20Path = ema20.map((v, i) => `${i === 0 ? "M" : "L"}${toX(i)},${toY(v)}`).join(" ");
  const ema50Path = ema50.map((v, i) => `${i === 0 ? "M" : "L"}${toX(i)},${toY(v)}`).join(" ");
  const fillPath = `M${toX(0)},${height - 20} ${data.map((v, i) => `L${toX(i)},${toY(v)}`).join(" ")} L${toX(data.length - 1)},${height - 20} Z`;
  const positive = data[data.length - 1] >= data[0];
  const color = positive ? "#10B981" : "#EF4444";

  const gridLevels = 5;
  const gridLines = Array.from({ length: gridLevels + 1 }, (_, i) => {
    const val = min + (range * i) / gridLevels;
    return { y: toY(val), label: val >= 1 ? `$${val.toFixed(2)}` : `$${val.toFixed(6)}` };
  });

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="w-full">
      <defs>
        <linearGradient id="priceGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      {gridLines.map((g, i) => (
        <g key={i}>
          <line x1="0" y1={g.y} x2={width} y2={g.y} stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
          <text x="4" y={g.y - 4} fill="rgba(255,255,255,0.25)" fontSize="9" fontFamily="monospace">{g.label}</text>
        </g>
      ))}
      <path d={fillPath} fill="url(#priceGrad)" />
      <path d={ema50Path} fill="none" stroke="#F59E0B" strokeWidth="1.2" strokeDasharray="4,3" opacity="0.6" />
      <path d={ema20Path} fill="none" stroke="#8B5CF6" strokeWidth="1.2" opacity="0.7" />
      <path d={pricePath} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={toX(data.length - 1)} cy={toY(data[data.length - 1])} r="4" fill={color} stroke="#0A0E1A" strokeWidth="2" />
      {/* Legend */}
      <g transform={`translate(${width - 220}, 12)`}>
        <line x1="0" y1="0" x2="16" y2="0" stroke={color} strokeWidth="2" />
        <text x="20" y="4" fill="rgba(255,255,255,0.5)" fontSize="9">Prix</text>
        <line x1="60" y1="0" x2="76" y2="0" stroke="#8B5CF6" strokeWidth="1.2" />
        <text x="80" y="4" fill="rgba(255,255,255,0.5)" fontSize="9">EMA 20</text>
        <line x1="120" y1="0" x2="136" y2="0" stroke="#F59E0B" strokeWidth="1.2" strokeDasharray="4,3" />
        <text x="140" y="4" fill="rgba(255,255,255,0.5)" fontSize="9">EMA 50</text>
      </g>
    </svg>
  );
}

function RSIChart({ data, width = 700, height = 100 }: { data: number[]; width?: number; height?: number }) {
  if (!data || data.length < 2) return null;
  const toY = (v: number) => height - 10 - (v / 100) * (height - 20);
  const toX = (i: number) => (i / (data.length - 1)) * width;
  const path = data.map((v, i) => `${i === 0 ? "M" : "L"}${toX(i)},${toY(v)}`).join(" ");
  const lastVal = data[data.length - 1];
  const color = lastVal > 70 ? "#EF4444" : lastVal < 30 ? "#10B981" : "#8B5CF6";

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="w-full">
      <rect x="0" y={toY(70)} width={width} height={toY(30) - toY(70)} fill="rgba(139,92,246,0.05)" />
      <line x1="0" y1={toY(70)} x2={width} y2={toY(70)} stroke="rgba(239,68,68,0.3)" strokeWidth="1" strokeDasharray="4,4" />
      <line x1="0" y1={toY(30)} x2={width} y2={toY(30)} stroke="rgba(16,185,129,0.3)" strokeWidth="1" strokeDasharray="4,4" />
      <line x1="0" y1={toY(50)} x2={width} y2={toY(50)} stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
      <text x="4" y={toY(70) - 3} fill="rgba(239,68,68,0.5)" fontSize="9" fontFamily="monospace">70</text>
      <text x="4" y={toY(30) - 3} fill="rgba(16,185,129,0.5)" fontSize="9" fontFamily="monospace">30</text>
      <text x="4" y={toY(50) - 3} fill="rgba(255,255,255,0.2)" fontSize="9" fontFamily="monospace">50</text>
      <path d={path} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={toX(data.length - 1)} cy={toY(lastVal)} r="3" fill={color} stroke="#0A0E1A" strokeWidth="1.5" />
      <text x={width - 50} y={toY(lastVal) + 4} fill={color} fontSize="10" fontWeight="bold" fontFamily="monospace">
        {lastVal.toFixed(1)}
      </text>
    </svg>
  );
}

function MACDChart({ macd, signal, histogram, width = 700, height = 100 }: { macd: number[]; signal: number[]; histogram: number[]; width?: number; height?: number }) {
  if (!macd || macd.length < 2) return null;
  const allVals = [...macd, ...signal, ...histogram];
  const min = Math.min(...allVals);
  const max = Math.max(...allVals);
  const range = max - min || 1;
  const toY = (v: number) => height - 10 - ((v - min) / range) * (height - 20);
  const toX = (i: number) => (i / (macd.length - 1)) * width;
  const zeroY = toY(0);
  const barW = Math.max(1, width / macd.length - 1);

  const macdPath = macd.map((v, i) => `${i === 0 ? "M" : "L"}${toX(i)},${toY(v)}`).join(" ");
  const signalPath = signal.map((v, i) => `${i === 0 ? "M" : "L"}${toX(i)},${toY(v)}`).join(" ");

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="w-full">
      <line x1="0" y1={zeroY} x2={width} y2={zeroY} stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
      {histogram.map((v, i) => (
        <rect
          key={i}
          x={toX(i) - barW / 2}
          y={v >= 0 ? toY(v) : zeroY}
          width={barW}
          height={Math.abs(toY(v) - zeroY)}
          fill={v >= 0 ? "rgba(16,185,129,0.4)" : "rgba(239,68,68,0.4)"}
          rx="0.5"
        />
      ))}
      <path d={signalPath} fill="none" stroke="#F59E0B" strokeWidth="1.2" opacity="0.8" />
      <path d={macdPath} fill="none" stroke="#3B82F6" strokeWidth="1.5" strokeLinecap="round" />
      {/* Legend */}
      <g transform="translate(4, 12)">
        <line x1="0" y1="0" x2="12" y2="0" stroke="#3B82F6" strokeWidth="1.5" />
        <text x="16" y="3" fill="rgba(255,255,255,0.4)" fontSize="8">MACD</text>
        <line x1="55" y1="0" x2="67" y2="0" stroke="#F59E0B" strokeWidth="1.2" />
        <text x="71" y="3" fill="rgba(255,255,255,0.4)" fontSize="8">Signal</text>
      </g>
    </svg>
  );
}

/* ─── Volume bars ─── */
function VolumeChart({ data, width = 700, height = 60 }: { data: number[]; width?: number; height?: number }) {
  if (!data || data.length < 2) return null;
  // Simulate volume from price changes
  const volumes = data.map((v, i) => {
    if (i === 0) return 50;
    const change = Math.abs(v - data[i - 1]);
    return 20 + change * 100 + Math.random() * 30;
  });
  const maxVol = Math.max(...volumes);
  const barW = Math.max(1, width / volumes.length - 1);

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="w-full">
      {volumes.map((v, i) => {
        const barH = (v / maxVol) * (height - 10);
        const isUp = i > 0 && data[i] >= data[i - 1];
        return (
          <rect
            key={i}
            x={(i / (volumes.length - 1)) * width - barW / 2}
            y={height - barH}
            width={barW}
            height={barH}
            fill={isUp ? "rgba(16,185,129,0.25)" : "rgba(239,68,68,0.25)"}
            rx="0.5"
          />
        );
      })}
    </svg>
  );
}

/* ─── Main ─── */
export default function Graphiques() {
  const [coins, setCoins] = useState<CoinData[]>([]);
  const [selected, setSelected] = useState("bitcoin");
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState("");
  const [showIndicators, setShowIndicators] = useState({ rsi: true, macd: true, volume: true });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(
        "https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=50&page=1&sparkline=true&price_change_percentage=24h"
      );
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setCoins(
            data.map((c: Record<string, unknown>) => ({
              id: c.id as string,
              symbol: ((c.symbol as string) || "").toUpperCase(),
              name: c.name as string,
              price: (c.current_price as number) || 0,
              change24h: (c.price_change_percentage_24h as number) || 0,
              image: c.image as string,
              sparkline: ((c.sparkline_in_7d as { price?: number[] })?.price) || [],
            }))
          );
        }
      }
      setLastUpdate(new Date().toLocaleTimeString("fr-FR"));
    } catch {
      /* keep */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const i = setInterval(fetchData, 120000);
    return () => clearInterval(i);
  }, [fetchData]);

  const selectedCoin = coins.find((c) => c.id === selected);

  const indicators = useMemo(() => {
    if (!selectedCoin?.sparkline?.length) return null;
    const d = selectedCoin.sparkline;
    return {
      rsi: computeRSI(d),
      ema20: computeEMA(d, 20),
      ema50: computeEMA(d, 50),
      ...computeMACD(d),
    };
  }, [selectedCoin]);

  const lastRSI = indicators?.rsi?.[indicators.rsi.length - 1] ?? 50;
  const rsiLabel = lastRSI > 70 ? "Suracheté" : lastRSI < 30 ? "Survendu" : "Neutre";
  const rsiColor = lastRSI > 70 ? "text-red-400" : lastRSI < 30 ? "text-emerald-400" : "text-purple-400";

  return (
    <div className="min-h-screen bg-[#0A0E1A] text-white">
      <Sidebar />
      <main className="ml-[260px] p-6 min-h-screen">
        {/* Hero */}
        <div className="relative rounded-2xl overflow-hidden mb-6 h-[140px] bg-gradient-to-r from-cyan-900/40 to-blue-900/40">
          <div className="absolute inset-0 bg-gradient-to-r from-[#0A0E1A]/90 via-[#0A0E1A]/60 to-transparent" />
          <div className="relative z-10 h-full flex items-center justify-between px-8">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <LineChart className="w-7 h-7 text-cyan-400" />
                <h1 className="text-2xl font-extrabold">Graphiques Avancés</h1>
              </div>
              <p className="text-sm text-gray-400">
                Style TradingView • Prix + EMA • RSI • MACD • Volume • Top 50 cryptos
              </p>
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

        {/* Coin Selector */}
        <div className="bg-[#111827] border border-white/[0.06] rounded-2xl p-4 mb-6">
          <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto">
            {coins.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelected(c.id)}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                  selected === c.id
                    ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30"
                    : "bg-white/[0.04] text-gray-400 border border-white/[0.06] hover:bg-white/[0.08]"
                }`}
              >
                {c.image && <img src={c.image} alt={c.symbol} className="w-4 h-4 rounded-full" />}
                {c.symbol}
              </button>
            ))}
          </div>
        </div>

        {/* Main Chart Area */}
        {selectedCoin && indicators && (
          <div className="space-y-4">
            {/* Price Info Bar */}
            <div className="bg-[#111827] border border-white/[0.06] rounded-2xl p-5">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-4">
                  {selectedCoin.image && (
                    <img src={selectedCoin.image} alt={selectedCoin.symbol} className="w-10 h-10 rounded-full" />
                  )}
                  <div>
                    <h2 className="text-xl font-extrabold">
                      {selectedCoin.name} ({selectedCoin.symbol})
                    </h2>
                    <p className="text-xs text-gray-500">Données 7 jours • ~168 points</p>
                  </div>
                  <div className="ml-4">
                    <p className="text-2xl font-extrabold">
                      $
                      {selectedCoin.price >= 1
                        ? selectedCoin.price.toLocaleString("en-US", { maximumFractionDigits: 2 })
                        : selectedCoin.price.toFixed(6)}
                    </p>
                    <p
                      className={`text-sm font-bold flex items-center gap-1 ${selectedCoin.change24h >= 0 ? "text-emerald-400" : "text-red-400"}`}
                    >
                      {selectedCoin.change24h >= 0 ? (
                        <TrendingUp className="w-4 h-4" />
                      ) : (
                        <TrendingDown className="w-4 h-4" />
                      )}
                      {selectedCoin.change24h >= 0 ? "+" : ""}
                      {selectedCoin.change24h.toFixed(2)}% (24h)
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-center">
                    <p className="text-[10px] text-gray-500 uppercase font-bold">RSI (14)</p>
                    <p className={`text-lg font-extrabold ${rsiColor}`}>{lastRSI.toFixed(1)}</p>
                    <p className={`text-[10px] font-bold ${rsiColor}`}>{rsiLabel}</p>
                  </div>
                  <div className="flex gap-2">
                    {(["rsi", "macd", "volume"] as const).map((ind) => (
                      <button
                        key={ind}
                        onClick={() =>
                          setShowIndicators((prev) => ({ ...prev, [ind]: !prev[ind] }))
                        }
                        className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all ${
                          showIndicators[ind]
                            ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30"
                            : "bg-white/[0.04] text-gray-500 border border-white/[0.06]"
                        }`}
                      >
                        {ind}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Price + EMA Chart */}
            <div className="bg-[#111827] border border-white/[0.06] rounded-2xl p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-gray-400">
                  📈 Prix + EMA 20 / EMA 50
                </h3>
              </div>
              <PriceChart
                data={selectedCoin.sparkline}
                ema20={indicators.ema20}
                ema50={indicators.ema50}
                height={300}
              />
            </div>

            {/* Volume */}
            {showIndicators.volume && (
              <div className="bg-[#111827] border border-white/[0.06] rounded-2xl p-5">
                <h3 className="text-sm font-bold text-gray-400 mb-3">📊 Volume</h3>
                <VolumeChart data={selectedCoin.sparkline} height={60} />
              </div>
            )}

            {/* RSI */}
            {showIndicators.rsi && (
              <div className="bg-[#111827] border border-white/[0.06] rounded-2xl p-5">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-bold text-gray-400">
                    📉 RSI (14) — Relative Strength Index
                  </h3>
                  <div className="flex items-center gap-3 text-[10px]">
                    <span className="text-red-400">● &gt;70 Suracheté</span>
                    <span className="text-emerald-400">● &lt;30 Survendu</span>
                  </div>
                </div>
                <RSIChart data={indicators.rsi} height={120} />
              </div>
            )}

            {/* MACD */}
            {showIndicators.macd && (
              <div className="bg-[#111827] border border-white/[0.06] rounded-2xl p-5">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-bold text-gray-400">
                    📊 MACD (12, 26, 9) — Moving Average Convergence Divergence
                  </h3>
                </div>
                <MACDChart
                  macd={indicators.macd}
                  signal={indicators.signal}
                  histogram={indicators.histogram}
                  height={120}
                />
              </div>
            )}
          </div>
        )}

        {/* Mini Charts Grid */}
        <div className="mt-6">
          <h3 className="text-lg font-bold mb-4">Aperçu rapide — Top 30</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {coins.slice(0, 30).map((c) => {
              const miniRSI = computeRSI(c.sparkline);
              const lastMiniRSI = miniRSI[miniRSI.length - 1] || 50;
              return (
                <div
                  key={c.id}
                  onClick={() => setSelected(c.id)}
                  className={`bg-[#111827] border rounded-2xl p-4 cursor-pointer transition-all hover:border-white/[0.15] ${
                    selected === c.id ? "border-cyan-500/30" : "border-white/[0.06]"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {c.image && (
                        <img src={c.image} alt={c.symbol} className="w-5 h-5 rounded-full" />
                      )}
                      <div>
                        <p className="text-sm font-bold">{c.symbol}</p>
                        <p className="text-[10px] text-gray-500">{c.name}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold">
                        $
                        {c.price >= 1
                          ? c.price.toLocaleString("en-US", { maximumFractionDigits: 2 })
                          : c.price.toFixed(6)}
                      </p>
                      <p
                        className={`text-xs font-bold ${c.change24h >= 0 ? "text-emerald-400" : "text-red-400"}`}
                      >
                        {c.change24h >= 0 ? "+" : ""}
                        {c.change24h.toFixed(2)}%
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <RSIChart data={miniRSI.slice(-48)} width={200} height={40} />
                    </div>
                    <div className="text-right ml-2">
                      <p className="text-[9px] text-gray-500">RSI</p>
                      <p
                        className={`text-xs font-bold ${lastMiniRSI > 70 ? "text-red-400" : lastMiniRSI < 30 ? "text-emerald-400" : "text-gray-400"}`}
                      >
                        {lastMiniRSI.toFixed(0)}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
}