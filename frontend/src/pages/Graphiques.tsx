import { useEffect, useState, useCallback, useRef } from "react";
import Sidebar from "@/components/Sidebar";
import { RefreshCw, TrendingUp, TrendingDown, Search, Maximize2, Minimize2, AlertCircle } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import { fetchTop200, formatPrice, type CoinMarketData } from "@/lib/cryptoApi";
import Footer from "@/components/Footer";
import { createChart, ColorType, LineSeries, CandlestickSeries, HistogramSeries } from "lightweight-charts";

/* ── Technical Indicator Calculations ── */

function computeRSI(data: number[], period = 14): number[] {
  const rsi: number[] = [];
  if (data.length < period + 1) return data.map(() => 50);
  let avgGain = 0, avgLoss = 0;
  for (let i = 1; i <= period; i++) {
    const diff = data[i] - data[i - 1];
    if (diff > 0) avgGain += diff; else avgLoss += Math.abs(diff);
  }
  avgGain /= period;
  avgLoss /= period;
  for (let i = 0; i < period; i++) rsi.push(50);
  rsi.push(avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss));
  for (let i = period + 1; i < data.length; i++) {
    const diff = data[i] - data[i - 1];
    avgGain = (avgGain * (period - 1) + (diff > 0 ? diff : 0)) / period;
    avgLoss = (avgLoss * (period - 1) + (diff < 0 ? Math.abs(diff) : 0)) / period;
    rsi.push(avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss));
  }
  return rsi;
}

function computeEMA(data: number[], period: number): number[] {
  const ema: number[] = [];
  if (!data.length) return ema;
  const k = 2 / (period + 1);
  ema.push(data[0]);
  for (let i = 1; i < data.length; i++) ema.push(data[i] * k + ema[i - 1] * (1 - k));
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

function computeStochastic(data: number[], period = 14, smoothK = 3): { k: number[]; d: number[] } {
  const kValues: number[] = [];
  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) { kValues.push(50); continue; }
    const slice = data.slice(i - period + 1, i + 1);
    const high = Math.max(...slice);
    const low = Math.min(...slice);
    kValues.push(high === low ? 50 : ((data[i] - low) / (high - low)) * 100);
  }
  const dValues: number[] = [];
  for (let i = 0; i < kValues.length; i++) {
    if (i < smoothK - 1) { dValues.push(kValues[i]); continue; }
    const avg = kValues.slice(i - smoothK + 1, i + 1).reduce((a, b) => a + b, 0) / smoothK;
    dValues.push(avg);
  }
  return { k: kValues, d: dValues };
}

/* ── Helper: build time array from sparkline ── */
function buildTimeArray(pricesLength: number): number[] {
  const now = Math.floor(Date.now() / 1000);
  const interval = Math.floor((7 * 24 * 3600) / pricesLength);
  const startTime = now - pricesLength * interval;
  return Array.from({ length: pricesLength }, (_, i) => startTime + i * interval);
}

/* ── Chart theme config ── */
const CHART_THEME = {
  layout: { background: { type: ColorType.Solid as const, color: "#111827" }, textColor: "#6B7280" },
  grid: { vertLines: { color: "rgba(255,255,255,0.03)" }, horzLines: { color: "rgba(255,255,255,0.03)" } },
  timeScale: { borderColor: "rgba(255,255,255,0.08)", timeVisible: true, secondsVisible: false },
  rightPriceScale: { borderColor: "rgba(255,255,255,0.08)" },
  crosshair: { mode: 0 as const },
};

/* ── Indicator Sub-Chart Component ── */
function IndicatorChart({
  label,
  height,
  prices,
  times,
  renderSeries,
}: {
  label: string;
  height: number;
  prices: number[];
  times: number[];
  renderSeries: (chart: ReturnType<typeof createChart>, times: number[]) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartInstanceRef = useRef<ReturnType<typeof createChart> | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !prices.length || !times.length) return;

    if (chartInstanceRef.current) {
      chartInstanceRef.current.remove();
      chartInstanceRef.current = null;
    }

    const timer = setTimeout(() => {
      if (!container || container.clientWidth === 0) return;

      const chart = createChart(container, {
        width: container.clientWidth,
        height,
        ...CHART_THEME,
        rightPriceScale: { ...CHART_THEME.rightPriceScale, scaleMargins: { top: 0.1, bottom: 0.1 } },
      });

      chartInstanceRef.current = chart;
      renderSeries(chart, times);
      chart.timeScale().fitContent();

      const ro = new ResizeObserver(() => {
        if (container.clientWidth > 0) {
          chart.applyOptions({ width: container.clientWidth });
        }
      });
      ro.observe(container);
      (chart as any).__ro = ro;
    }, 60);

    return () => {
      clearTimeout(timer);
      if (chartInstanceRef.current) {
        const ro = (chartInstanceRef.current as any).__ro;
        if (ro) ro.disconnect();
        chartInstanceRef.current.remove();
        chartInstanceRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prices, times, height]);

  return (
    <div className="bg-[#111827] border border-white/[0.06] rounded-xl overflow-hidden relative mt-2">
      <div className="absolute top-2 left-3 z-10 flex items-center gap-2">
        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider bg-[#111827]/80 px-2 py-0.5 rounded">
          {label}
        </span>
      </div>
      <div ref={containerRef} style={{ width: "100%", height: `${height}px` }} />
    </div>
  );
}

/* ── Main Component ── */
export default function Graphiques() {
  const [coins, setCoins] = useState<CoinMarketData[]>([]);
  const [selected, setSelected] = useState("bitcoin");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [lastUpdate, setLastUpdate] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [ohlcData, setOhlcData] = useState<Array<{ time: number; open: number; high: number; low: number; close: number }>>([]);
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<ReturnType<typeof createChart> | null>(null);

  /* ── Fetch OHLC candlestick data ── */
  const fetchOHLC = useCallback(async (coinId: string) => {
    try {
      const res = await fetch(`/api/coingecko/coins/${coinId}/ohlc?vs_currency=usd&days=7`, {
        signal: AbortSignal.timeout(15000),
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          const mapped = data.map((item: number[]) => ({
            time: Math.floor(item[0] / 1000),
            open: item[1],
            high: item[2],
            low: item[3],
            close: item[4],
          }));
          setOhlcData(mapped);
          return;
        }
      }
    } catch {
      // OHLC fetch failed, will fallback to line chart
    }
    setOhlcData([]);
  }, []);

  useEffect(() => {
    if (selected) {
      fetchOHLC(selected);
    }
  }, [selected, fetchOHLC]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await fetchTop200(true);
      if (!data || data.length === 0) {
        setError("Impossible de charger les données. Les proxies CORS sont peut-être indisponibles.");
        return;
      }
      setCoins(data);
      setLastUpdate(new Date().toLocaleTimeString("fr-FR"));
    } catch (err) {
      console.error("[Graphiques] Fetch error:", err);
      setError("Erreur lors du chargement des données de marché.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const i = setInterval(fetchData, 120000);
    return () => clearInterval(i);
  }, [fetchData]);

  /* ── Main Price Chart ── */
  useEffect(() => {
    const container = chartContainerRef.current;
    if (!container) return;

    if (chartRef.current) {
      chartRef.current.remove();
      chartRef.current = null;
    }

    const selectedCoin = coins.find((c) => c.id === selected);
    if (!selectedCoin) return;

    // Need either OHLC data or sparkline data to render
    const hasOhlc = ohlcData.length > 0;
    const hasSparklineData = selectedCoin.sparkline_in_7d?.price?.length > 0;
    if (!hasOhlc && !hasSparklineData) return;

    const timer = setTimeout(() => {
      if (!container || container.clientWidth === 0 || container.clientHeight === 0) return;

      const chart = createChart(container, {
        width: container.clientWidth,
        height: container.clientHeight,
        ...CHART_THEME,
      });

      chartRef.current = chart;

      const pricePrecision = selectedCoin.current_price >= 1 ? 2 : 6;
      const priceMinMove = selectedCoin.current_price >= 1 ? 0.01 : 0.000001;

      if (hasOhlc) {
        // Use real candlestick chart with OHLC data
        const candleSeries = chart.addSeries(CandlestickSeries, {
          upColor: "#10B981",
          downColor: "#EF4444",
          borderDownColor: "#EF4444",
          borderUpColor: "#10B981",
          wickDownColor: "#EF4444",
          wickUpColor: "#10B981",
          priceFormat: {
            type: "price",
            precision: pricePrecision,
            minMove: priceMinMove,
          },
        });

        candleSeries.setData(
          ohlcData.map((d) => ({
            time: d.time as unknown as number,
            open: d.open,
            high: d.high,
            low: d.low,
            close: d.close,
          }))
        );
      } else if (hasSparklineData) {
        // Fallback to line chart if OHLC unavailable
        const prices = selectedCoin.sparkline_in_7d!.price;
        const times = buildTimeArray(prices.length);
        const lineColor = selectedCoin.price_change_percentage_24h >= 0 ? "#10B981" : "#EF4444";

        const lineSeries = chart.addSeries(LineSeries, {
          color: lineColor,
          lineWidth: 2,
          crosshairMarkerVisible: true,
          priceFormat: {
            type: "price",
            precision: pricePrecision,
            minMove: priceMinMove,
          },
        });

        lineSeries.setData(
          prices.map((p: number, i: number) => ({ time: times[i] as unknown as number, value: p }))
        );
      }

      chart.timeScale().fitContent();

      const ro = new ResizeObserver(() => {
        if (container.clientWidth > 0 && container.clientHeight > 0) {
          chart.applyOptions({ width: container.clientWidth, height: container.clientHeight });
        }
      });
      ro.observe(container);
      (chart as any).__ro = ro;
    }, 50);

    return () => {
      clearTimeout(timer);
      if (chartRef.current) {
        const ro = (chartRef.current as any).__ro;
        if (ro) ro.disconnect();
        chartRef.current.remove();
        chartRef.current = null;
      }
    };
  }, [selected, coins, ohlcData]);

  const selectedCoin = coins.find((c) => c.id === selected);
  const sparkPrices = selectedCoin?.sparkline_in_7d?.price || [];
  const hasSparkline = sparkPrices.length > 0;
  const times = hasSparkline ? buildTimeArray(sparkPrices.length) : [];

  const filteredCoins = searchQuery
    ? coins.filter(
        (c) =>
          c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          c.symbol.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : coins;

  /* ── RSI render function ── */
  const renderRSI = useCallback(
    (chart: ReturnType<typeof createChart>, t: number[]) => {
      const rsiData = computeRSI(sparkPrices);
      const rsiSeries = chart.addSeries(LineSeries, {
        color: "#8B5CF6",
        lineWidth: 2,
        priceFormat: { type: "price", precision: 1, minMove: 0.1 },
      });
      rsiSeries.setData(
        rsiData.map((v, i) => ({ time: t[i] as unknown as number, value: v }))
      );

      // Overbought / oversold lines
      const overBought = chart.addSeries(LineSeries, {
        color: "rgba(239,68,68,0.3)",
        lineWidth: 1,
        lineStyle: 2,
        crosshairMarkerVisible: false,
        lastValueVisible: false,
        priceLineVisible: false,
      });
      overBought.setData(t.map((tm) => ({ time: tm as unknown as number, value: 70 })));

      const overSold = chart.addSeries(LineSeries, {
        color: "rgba(16,185,129,0.3)",
        lineWidth: 1,
        lineStyle: 2,
        crosshairMarkerVisible: false,
        lastValueVisible: false,
        priceLineVisible: false,
      });
      overSold.setData(t.map((tm) => ({ time: tm as unknown as number, value: 30 })));
    },
    [sparkPrices]
  );

  /* ── MACD render function ── */
  const renderMACD = useCallback(
    (chart: ReturnType<typeof createChart>, t: number[]) => {
      const { macd, signal, histogram } = computeMACD(sparkPrices);

      const histSeries = chart.addSeries(HistogramSeries, {
        priceFormat: { type: "price", precision: 6, minMove: 0.000001 },
      });
      histSeries.setData(
        histogram.map((v, i) => ({
          time: t[i] as unknown as number,
          value: v,
          color: v >= 0 ? "rgba(16,185,129,0.5)" : "rgba(239,68,68,0.5)",
        }))
      );

      const macdSeries = chart.addSeries(LineSeries, {
        color: "#3B82F6",
        lineWidth: 2,
        priceFormat: { type: "price", precision: 6, minMove: 0.000001 },
      });
      macdSeries.setData(
        macd.map((v, i) => ({ time: t[i] as unknown as number, value: v }))
      );

      const signalSeries = chart.addSeries(LineSeries, {
        color: "#F59E0B",
        lineWidth: 1,
        priceFormat: { type: "price", precision: 6, minMove: 0.000001 },
      });
      signalSeries.setData(
        signal.map((v, i) => ({ time: t[i] as unknown as number, value: v }))
      );
    },
    [sparkPrices]
  );

  /* ── Stochastic render function ── */
  const renderStochastic = useCallback(
    (chart: ReturnType<typeof createChart>, t: number[]) => {
      const { k, d } = computeStochastic(sparkPrices);

      const kSeries = chart.addSeries(LineSeries, {
        color: "#06B6D4",
        lineWidth: 2,
        priceFormat: { type: "price", precision: 1, minMove: 0.1 },
      });
      kSeries.setData(k.map((v, i) => ({ time: t[i] as unknown as number, value: v })));

      const dSeries = chart.addSeries(LineSeries, {
        color: "#F59E0B",
        lineWidth: 1,
        priceFormat: { type: "price", precision: 1, minMove: 0.1 },
      });
      dSeries.setData(d.map((v, i) => ({ time: t[i] as unknown as number, value: v })));

      // Overbought / oversold
      const ob = chart.addSeries(LineSeries, {
        color: "rgba(239,68,68,0.3)",
        lineWidth: 1,
        lineStyle: 2,
        crosshairMarkerVisible: false,
        lastValueVisible: false,
        priceLineVisible: false,
      });
      ob.setData(t.map((tm) => ({ time: tm as unknown as number, value: 80 })));

      const os = chart.addSeries(LineSeries, {
        color: "rgba(16,185,129,0.3)",
        lineWidth: 1,
        lineStyle: 2,
        crosshairMarkerVisible: false,
        lastValueVisible: false,
        priceLineVisible: false,
      });
      os.setData(t.map((tm) => ({ time: tm as unknown as number, value: 20 })));
    },
    [sparkPrices]
  );

  /* ── Fullscreen Mode ── */
  if (isFullscreen) {
    return (
      <div style={{ position: "fixed", inset: 0, zIndex: 9999, background: "#0A0E1A" }}>
        <div style={{ position: "absolute", top: 8, right: 8, zIndex: 10000 }}>
          <button
            onClick={() => setIsFullscreen(false)}
            className="flex items-center gap-1 px-3 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-bold transition-all shadow-lg"
          >
            <Minimize2 className="w-4 h-4" /> Quitter plein écran
          </button>
        </div>
        <div ref={chartContainerRef} style={{ position: "absolute", inset: 0 }} />
        {!hasSparkline && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <AlertCircle className="w-12 h-12 text-gray-600 mx-auto mb-3" />
              <p className="text-gray-400 font-bold">Données sparkline indisponibles</p>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0E1A] text-white">
      <Sidebar />
      <main className="md:ml-[260px] pt-14 md:pt-0 p-3 overflow-y-auto" style={{ height: "100vh" }}>
        <PageHeader
          icon={<span className="text-lg">📈</span>}
          title="Graphiques"
          subtitle="Analysez les graphiques de prix en temps réel avec indicateurs techniques RSI, MACD et Stochastic."
          accentColor="blue"
          steps={[
            { n: "1", title: "Sélectionnez une crypto", desc: "Recherchez ou cliquez sur une crypto dans la liste pour afficher son graphique." },
            { n: "2", title: "Analysez les indicateurs", desc: "RSI, MACD et Stochastic sont affichés sous le graphique principal." },
            { n: "3", title: "Mode plein écran", desc: "Cliquez sur le bouton plein écran pour une vue étendue." },
          ]}
        />

        {/* Compact Header */}
        <div className="flex items-center justify-between mb-2 flex-shrink-0" style={{ height: "36px" }}>
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-extrabold">📈 Graphiques</h1>
            {selectedCoin && (
              <div className="flex items-center gap-2">
                {selectedCoin.image && <img src={selectedCoin.image} alt="" className="w-5 h-5 rounded-full" />}
                <span className="font-bold text-sm">{selectedCoin.name}</span>
                <span className="text-lg font-black">${formatPrice(selectedCoin.current_price)}</span>
                <span className={`text-xs font-bold flex items-center gap-0.5 ${selectedCoin.price_change_percentage_24h >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                  {selectedCoin.price_change_percentage_24h >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                  {(selectedCoin.price_change_percentage_24h || 0).toFixed(2)}%
                </span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsFullscreen(true)}
              className="flex items-center gap-1 px-2 py-1 rounded-lg bg-indigo-600/30 hover:bg-indigo-600/50 border border-indigo-500/30 text-[10px] font-semibold transition-all text-indigo-300"
            >
              <Maximize2 className="w-3 h-3" /> Plein écran
            </button>
            <button
              onClick={fetchData}
              disabled={loading}
              className="flex items-center gap-1 px-2 py-1 rounded-lg bg-white/[0.08] hover:bg-white/[0.12] border border-white/[0.06] text-[10px] font-semibold transition-all"
            >
              <RefreshCw className={`w-3 h-3 ${loading ? "animate-spin" : ""}`} />
              {lastUpdate || "MAJ"}
            </button>
          </div>
        </div>

        {/* Coin Selector */}
        <div className="flex items-center gap-2 mb-2 flex-shrink-0" style={{ height: "28px" }}>
          <div className="relative w-[160px]">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher..."
              className="w-full pl-6 pr-2 py-1 rounded-md bg-black/40 border border-white/[0.06] text-[10px] text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500/50"
            />
          </div>
          <div className="flex flex-wrap gap-1 max-h-[28px] overflow-hidden flex-1">
            {(searchQuery ? filteredCoins : coins).slice(0, 30).map((c) => (
              <button
                key={c.id}
                onClick={() => { setSelected(c.id); setSearchQuery(""); }}
                className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold transition-all whitespace-nowrap ${
                  selected === c.id
                    ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30"
                    : "bg-white/[0.03] text-gray-400 border border-white/[0.03] hover:bg-white/[0.06]"
                }`}
              >
                {c.image && <img src={c.image} alt="" className="w-3 h-3 rounded-full" />}
                {c.symbol.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 mb-2">
            <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
            <p className="text-xs text-red-400 font-medium">{error}</p>
            <button onClick={fetchData} className="ml-auto text-xs text-red-400 underline hover:text-red-300">Réessayer</button>
          </div>
        )}

        {/* Main Price Chart */}
        <div
          className="bg-[#111827] border border-white/[0.06] rounded-xl overflow-hidden relative"
          style={{ height: "400px" }}
        >
          <div className="absolute top-2 left-3 z-10">
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider bg-[#111827]/80 px-2 py-0.5 rounded">
              Bougies — 7 jours
            </span>
          </div>
          <div ref={chartContainerRef} style={{ width: "100%", height: "100%" }} />

          {loading && coins.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center bg-[#111827]">
              <div className="text-center">
                <RefreshCw className="w-8 h-8 text-cyan-400 animate-spin mx-auto mb-3" />
                <p className="text-sm text-gray-400 font-medium">Chargement des données de marché...</p>
              </div>
            </div>
          )}

          {!loading && coins.length > 0 && !hasSparkline && (
            <div className="absolute inset-0 flex items-center justify-center bg-[#111827]/90">
              <div className="text-center">
                <AlertCircle className="w-10 h-10 text-amber-400/60 mx-auto mb-3" />
                <p className="text-sm text-gray-400 font-bold mb-1">Données sparkline indisponibles pour {selectedCoin?.name || selected}</p>
                <p className="text-xs text-gray-600">Essayez BTC, ETH ou SOL.</p>
              </div>
            </div>
          )}

          {!loading && coins.length === 0 && !error && (
            <div className="absolute inset-0 flex items-center justify-center bg-[#111827]">
              <div className="text-center">
                <AlertCircle className="w-10 h-10 text-gray-600 mx-auto mb-3" />
                <p className="text-sm text-gray-400 font-bold">Aucune donnée disponible</p>
                <button onClick={fetchData} className="mt-3 px-4 py-2 rounded-lg bg-cyan-500/20 text-cyan-400 text-xs font-bold hover:bg-cyan-500/30 transition-all">
                  <RefreshCw className="w-3 h-3 inline mr-1" /> Recharger
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Technical Indicators */}
        {hasSparkline && (
          <>
            {/* Indicator Legend */}
            <div className="flex items-center gap-4 mt-3 mb-1 px-1">
              <span className="text-[10px] font-bold text-gray-600 uppercase tracking-wider">Indicateurs Techniques</span>
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1 text-[10px] text-violet-400 font-semibold">
                  <span className="w-2 h-2 rounded-full bg-violet-500" /> RSI (14)
                </span>
                <span className="flex items-center gap-1 text-[10px] text-blue-400 font-semibold">
                  <span className="w-2 h-2 rounded-full bg-blue-500" /> MACD
                </span>
                <span className="flex items-center gap-1 text-[10px] text-amber-400 font-semibold">
                  <span className="w-2 h-2 rounded-full bg-amber-500" /> Signal
                </span>
                <span className="flex items-center gap-1 text-[10px] text-cyan-400 font-semibold">
                  <span className="w-2 h-2 rounded-full bg-cyan-500" /> Stochastic
                </span>
              </div>
            </div>

            {/* RSI Chart */}
            <IndicatorChart
              label="RSI (14) — Survente: 30 | Surachat: 70"
              height={120}
              prices={sparkPrices}
              times={times}
              renderSeries={renderRSI}
            />

            {/* MACD Chart */}
            <IndicatorChart
              label="MACD (12, 26, 9)"
              height={120}
              prices={sparkPrices}
              times={times}
              renderSeries={renderMACD}
            />

            {/* Stochastic Chart */}
            <IndicatorChart
              label="Stochastic (14, 3) — Survente: 20 | Surachat: 80"
              height={120}
              prices={sparkPrices}
              times={times}
              renderSeries={renderStochastic}
            />
          </>
        )}

        <div className="mt-4">
          <Footer />
        </div>
      </main>
    </div>
  );
}