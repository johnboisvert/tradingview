import { useEffect, useState, useCallback, useRef } from "react";
import Sidebar from "@/components/Sidebar";
import { RefreshCw, TrendingUp, TrendingDown, Search, Maximize2, Minimize2, AlertCircle } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import { fetchTop200, formatPrice, type CoinMarketData } from "@/lib/cryptoApi";
import Footer from "@/components/Footer";
import { createChart, ColorType, LineSeries } from "lightweight-charts";

export default function Graphiques() {
  const [coins, setCoins] = useState<CoinMarketData[]>([]);
  const [selected, setSelected] = useState("bitcoin");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [lastUpdate, setLastUpdate] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<ReturnType<typeof createChart> | null>(null);

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
      console.log(`[Graphiques] Loaded ${data.length} coins. Sparkline available: ${data.filter(c => c.sparkline_in_7d?.price?.length).length}`);
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

  // Chart rendering effect
  useEffect(() => {
    const container = chartContainerRef.current;
    if (!container) return;

    // Clean up previous chart
    if (chartRef.current) {
      chartRef.current.remove();
      chartRef.current = null;
    }

    const selectedCoin = coins.find((c) => c.id === selected);
    if (!selectedCoin || !selectedCoin.sparkline_in_7d?.price?.length) {
      console.log(`[Graphiques] No sparkline data for ${selected}`);
      return;
    }

    console.log(`[Graphiques] Rendering chart for ${selected} with ${selectedCoin.sparkline_in_7d.price.length} data points`);

    // Small delay to ensure container has dimensions
    const timer = setTimeout(() => {
      if (!container || container.clientWidth === 0 || container.clientHeight === 0) {
        console.warn("[Graphiques] Container has no dimensions:", container.clientWidth, container.clientHeight);
        return;
      }

      const chart = createChart(container, {
        width: container.clientWidth,
        height: container.clientHeight,
        layout: {
          background: { type: ColorType.Solid, color: "#111827" },
          textColor: "#9CA3AF",
        },
        grid: {
          vertLines: { color: "rgba(255,255,255,0.04)" },
          horzLines: { color: "rgba(255,255,255,0.04)" },
        },
        timeScale: {
          borderColor: "rgba(255,255,255,0.1)",
          timeVisible: true,
        },
        rightPriceScale: {
          borderColor: "rgba(255,255,255,0.1)",
        },
        crosshair: {
          mode: 0,
        },
      });

      chartRef.current = chart;

      const prices = selectedCoin.sparkline_in_7d.price;
      const now = Math.floor(Date.now() / 1000);
      const interval = Math.floor((7 * 24 * 3600) / prices.length);
      const startTime = now - prices.length * interval;

      const lineColor =
        selectedCoin.price_change_percentage_24h >= 0 ? "#10B981" : "#EF4444";

      const lineSeries = chart.addSeries(LineSeries, {
        color: lineColor,
        lineWidth: 2,
        crosshairMarkerVisible: true,
        priceFormat: {
          type: "price",
          precision: selectedCoin.current_price >= 1 ? 2 : 6,
          minMove: selectedCoin.current_price >= 1 ? 0.01 : 0.000001,
        },
      });

      const lineData = prices.map((p: number, i: number) => ({
        time: (startTime + i * interval) as unknown as number,
        value: p,
      }));

      lineSeries.setData(lineData);
      chart.timeScale().fitContent();

      // Handle resize
      const resizeObserver = new ResizeObserver(() => {
        if (container.clientWidth > 0 && container.clientHeight > 0) {
          chart.applyOptions({
            width: container.clientWidth,
            height: container.clientHeight,
          });
        }
      });
      resizeObserver.observe(container);

      // Store cleanup for resize observer
      (chart as any).__resizeObserver = resizeObserver;
    }, 50);

    return () => {
      clearTimeout(timer);
      if (chartRef.current) {
        const ro = (chartRef.current as any).__resizeObserver;
        if (ro) ro.disconnect();
        chartRef.current.remove();
        chartRef.current = null;
      }
    };
  }, [selected, coins]);

  const selectedCoin = coins.find((c) => c.id === selected);

  const filteredCoins = searchQuery
    ? coins.filter(
        (c) =>
          c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          c.symbol.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : coins;

  const hasSparkline = selectedCoin?.sparkline_in_7d?.price?.length;

  // Fullscreen mode
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
        <div
          ref={chartContainerRef}
          style={{ position: "absolute", inset: 0 }}
        />
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
          subtitle="Analysez les graphiques de prix en temps réel. Accédez à tous les outils d'analyse technique directement depuis la plateforme."
          accentColor="blue"
          steps={[
            { n: "1", title: "Sélectionnez une crypto", desc: "Recherchez ou cliquez sur une crypto dans la liste pour afficher son graphique avec les données de marché." },
            { n: "2", title: "Analysez le graphique", desc: "Survolez le graphique pour voir les prix, utilisez le crosshair pour analyser les niveaux de prix sur 7 jours." },
            { n: "3", title: "Mode plein écran", desc: "Cliquez sur le bouton plein écran pour une vue étendue du graphique." },
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

        {/* Chart Container - FIXED HEIGHT instead of flex-1 */}
        <div
          className="bg-[#111827] border border-white/[0.06] rounded-xl overflow-hidden relative"
          style={{ height: "500px", minHeight: "400px" }}
        >
          {/* Chart canvas */}
          <div
            ref={chartContainerRef}
            style={{ width: "100%", height: "100%" }}
          />

          {/* Loading overlay */}
          {loading && coins.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center bg-[#111827]">
              <div className="text-center">
                <RefreshCw className="w-8 h-8 text-cyan-400 animate-spin mx-auto mb-3" />
                <p className="text-sm text-gray-400 font-medium">Chargement des données de marché...</p>
              </div>
            </div>
          )}

          {/* No sparkline data overlay */}
          {!loading && coins.length > 0 && !hasSparkline && (
            <div className="absolute inset-0 flex items-center justify-center bg-[#111827]/90">
              <div className="text-center">
                <AlertCircle className="w-10 h-10 text-amber-400/60 mx-auto mb-3" />
                <p className="text-sm text-gray-400 font-bold mb-1">Données sparkline indisponibles pour {selectedCoin?.name || selected}</p>
                <p className="text-xs text-gray-600">Les données de graphique 7 jours ne sont pas disponibles pour cette crypto.</p>
                <p className="text-xs text-gray-600 mt-1">Essayez de sélectionner BTC, ETH ou SOL.</p>
              </div>
            </div>
          )}

          {/* No data at all */}
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

        <Footer />
      </main>
    </div>
  );
}