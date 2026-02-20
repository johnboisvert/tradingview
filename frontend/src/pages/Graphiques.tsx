import { useEffect, useState, useCallback, useRef } from "react";
import Sidebar from "@/components/Sidebar";
import { RefreshCw, TrendingUp, TrendingDown, Search, Maximize2, Minimize2 } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import { fetchTop200, formatPrice, type CoinMarketData } from "@/lib/cryptoApi";
import Footer from "@/components/Footer";
import { createChart, ColorType, LineSeries } from "lightweight-charts";

export default function Graphiques() {
  const [coins, setCoins] = useState<CoinMarketData[]>([]);
  const [selected, setSelected] = useState("bitcoin");
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const tvContainerRef = useRef<HTMLDivElement>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchTop200(true);
      setCoins(data);
      setLastUpdate(new Date().toLocaleTimeString("fr-FR"));
    } catch {
      // keep existing
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const i = setInterval(fetchData, 120000);
    return () => clearInterval(i);
  }, [fetchData]);

  useEffect(() => {
    if (!tvContainerRef.current) return;
    const container = tvContainerRef.current;

    const selectedCoin = coins.find((c) => c.id === selected);
    if (!selectedCoin || !selectedCoin.sparkline_in_7d?.price?.length) return;

    const chart = createChart(container, {
      layout: {
        background: { type: ColorType.Solid, color: "#111827" },
        textColor: "#9CA3AF",
      },
      grid: {
        vertLines: { color: "rgba(255,255,255,0.04)" },
        horzLines: { color: "rgba(255,255,255,0.04)" },
      },
      autoSize: true,
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

    return () => {
      chart.remove();
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
          ref={tvContainerRef}
          style={{ position: "absolute", inset: 0 }}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0E1A] text-white">
      <Sidebar />
      <main
        className="md:ml-[260px] pt-14 md:pt-0 flex flex-col"
        style={{ height: "100vh", padding: "12px" }}
      >
        <PageHeader
          icon={<span className="text-lg">📈</span>}
          title="Graphiques"
          subtitle="Analysez les graphiques de prix en temps réel avec TradingView intégré. Accédez à tous les outils d’analyse technique directement depuis la plateforme."
          accentColor="blue"
          steps={[
            { n: "1", title: "Sélectionnez une crypto", desc: "Recherchez ou cliquez sur une crypto dans la liste pour afficher son graphique en temps réel avec les données de marché." },
            { n: "2", title: "Utilisez les outils", desc: "Dessinez des lignes de tendance, ajoutez des indicateurs (MA, RSI, MACD) et utilisez les outils de mesure directement sur le chart." },
            { n: "3", title: "Changez de timeframe", desc: "Analysez sur différentes unités de temps (1m, 5m, 1H, 4H, 1D) pour avoir une vision complète de la structure de prix." },
          ]}
        />
        {/* Compact Header - 40px */}
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

        {/* Coin Selector - 32px */}
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

        {/* TradingView Chart - ALL remaining space with position relative for absolute iframe */}
        <div
          className="flex-1 bg-[#111827] border border-white/[0.06] rounded-xl overflow-hidden"
          style={{ position: "relative", minHeight: "0" }}
        >
          <div
            ref={tvContainerRef}
            style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
          />
        </div>
        <Footer />
      </main>
    </div>
  );
}