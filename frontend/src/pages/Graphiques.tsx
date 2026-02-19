import { useEffect, useState, useCallback, useRef } from "react";
import Sidebar from "@/components/Sidebar";
import { RefreshCw, TrendingUp, TrendingDown, Search, Maximize2 } from "lucide-react";
import { fetchTop200, formatPrice, type CoinMarketData } from "@/lib/cryptoApi";

const TV_SYMBOLS: Record<string, string> = {
  bitcoin: "BINANCE:BTCUSDT",
  ethereum: "BINANCE:ETHUSDT",
  tether: "BINANCE:USDTUSD",
  ripple: "BINANCE:XRPUSDT",
  binancecoin: "BINANCE:BNBUSDT",
  solana: "BINANCE:SOLUSDT",
  dogecoin: "BINANCE:DOGEUSDT",
  cardano: "BINANCE:ADAUSDT",
  tron: "BINANCE:TRXUSDT",
  chainlink: "BINANCE:LINKUSDT",
  avalanche: "BINANCE:AVAXUSDT",
  "shiba-inu": "BINANCE:SHIBUSDT",
  polkadot: "BINANCE:DOTUSDT",
  "bitcoin-cash": "BINANCE:BCHUSDT",
  uniswap: "BINANCE:UNIUSDT",
  litecoin: "BINANCE:LTCUSDT",
  near: "BINANCE:NEARUSDT",
  stellar: "BINANCE:XLMUSDT",
  aptos: "BINANCE:APTUSDT",
  cosmos: "BINANCE:ATOMUSDT",
  arbitrum: "BINANCE:ARBUSDT",
  sui: "BINANCE:SUIUSDT",
  pepe: "BINANCE:PEPEUSDT",
  filecoin: "BINANCE:FILUSDT",
  render: "BINANCE:RENDERUSDT",
};

function getTVSymbol(coinId: string, symbol: string): string {
  if (TV_SYMBOLS[coinId]) return TV_SYMBOLS[coinId];
  return `BINANCE:${symbol.toUpperCase()}USDT`;
}

export default function Graphiques() {
  const [coins, setCoins] = useState<CoinMarketData[]>([]);
  const [selected, setSelected] = useState("bitcoin");
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const tvContainerRef = useRef<HTMLDivElement>(null);
  const chartWrapperRef = useRef<HTMLDivElement>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchTop200(false);
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
    container.innerHTML = "";

    const selectedCoin = coins.find((c) => c.id === selected);
    if (!selectedCoin) return;

    const tvSymbol = getTVSymbol(selected, selectedCoin.symbol);

    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js";
    script.type = "text/javascript";
    script.async = true;
    script.innerHTML = JSON.stringify({
      autosize: true,
      symbol: tvSymbol,
      interval: "60",
      timezone: "Europe/Paris",
      theme: "dark",
      style: "1",
      locale: "fr",
      backgroundColor: "rgba(17, 24, 39, 1)",
      gridColor: "rgba(255, 255, 255, 0.04)",
      allow_symbol_change: true,
      calendar: false,
      support_host: "https://www.tradingview.com",
      hide_top_toolbar: false,
      hide_legend: false,
      save_image: true,
      studies: ["RSI@tv-basicstudies", "MACD@tv-basicstudies"],
      withdateranges: true,
    });

    const widgetDiv = document.createElement("div");
    widgetDiv.className = "tradingview-widget-container__widget";
    widgetDiv.style.height = "100%";
    widgetDiv.style.width = "100%";

    container.appendChild(widgetDiv);
    container.appendChild(script);
  }, [selected, coins]);

  const toggleFullscreen = () => {
    if (!chartWrapperRef.current) return;
    if (!isFullscreen) {
      chartWrapperRef.current.requestFullscreen?.();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.();
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handler);
    return () => document.removeEventListener("fullscreenchange", handler);
  }, []);

  const selectedCoin = coins.find((c) => c.id === selected);

  const filteredCoins = searchQuery
    ? coins.filter(
        (c) =>
          c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          c.symbol.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : coins;

  return (
    <div className="min-h-screen bg-[#0A0E1A] text-white">
      <Sidebar />
      <main className="ml-[260px] p-4">
        {/* Compact Header */}
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 className="text-lg font-extrabold flex items-center gap-2">📈 Graphiques Avancés</h1>
            <p className="text-[10px] text-gray-500">TradingView • RSI • MACD • Top 200 cryptos</p>
          </div>
          <button
            onClick={fetchData}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/[0.08] hover:bg-white/[0.12] border border-white/[0.06] text-[10px] font-semibold transition-all"
          >
            <RefreshCw className={`w-3 h-3 ${loading ? "animate-spin" : ""}`} />
            {lastUpdate ? `MAJ ${lastUpdate}` : "Rafraîchir"}
          </button>
        </div>

        {/* Compact Coin Selector */}
        <div className="bg-[#111827] border border-white/[0.06] rounded-lg p-2 mb-2">
          <div className="flex items-center gap-2 mb-1.5">
            <div className="relative flex-1 max-w-[200px]">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Rechercher..."
                className="w-full pl-6 pr-2 py-1 rounded-md bg-black/30 border border-white/[0.06] text-[10px] text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500/50"
              />
            </div>
            <span className="text-[9px] text-gray-500">{coins.length} cryptos</span>
          </div>
          <div className="flex flex-wrap gap-1 max-h-16 overflow-y-auto">
            {filteredCoins.slice(0, 200).map((c) => (
              <button
                key={c.id}
                onClick={() => { setSelected(c.id); setSearchQuery(""); }}
                className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold transition-all ${
                  selected === c.id
                    ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30"
                    : "bg-white/[0.03] text-gray-400 border border-white/[0.03] hover:bg-white/[0.06]"
                }`}
              >
                {c.image && <img src={c.image} alt={c.symbol} className="w-3 h-3 rounded-full" />}
                {c.symbol.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        {/* Selected Coin Info - Very Compact */}
        {selectedCoin && (
          <div className="bg-[#111827] border border-white/[0.06] rounded-lg p-2 mb-2">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                {selectedCoin.image && <img src={selectedCoin.image} alt={selectedCoin.symbol} className="w-6 h-6 rounded-full" />}
                <div>
                  <span className="text-sm font-extrabold">{selectedCoin.name}</span>
                  <span className="text-[10px] text-gray-500 ml-1">({selectedCoin.symbol.toUpperCase()}) #{selectedCoin.market_cap_rank}</span>
                </div>
                <span className="text-lg font-extrabold ml-2">${formatPrice(selectedCoin.current_price)}</span>
                <span className={`text-xs font-bold flex items-center gap-0.5 ${selectedCoin.price_change_percentage_24h >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                  {selectedCoin.price_change_percentage_24h >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                  {(selectedCoin.price_change_percentage_24h || 0).toFixed(2)}%
                </span>
              </div>
              <div className="flex items-center gap-4 text-center">
                <div>
                  <p className="text-[8px] text-gray-500 uppercase font-bold">7j</p>
                  <p className={`text-[10px] font-bold ${(selectedCoin.price_change_percentage_7d_in_currency || 0) >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                    {(selectedCoin.price_change_percentage_7d_in_currency || 0) >= 0 ? "+" : ""}{(selectedCoin.price_change_percentage_7d_in_currency || 0).toFixed(1)}%
                  </p>
                </div>
                <div>
                  <p className="text-[8px] text-gray-500 uppercase font-bold">30j</p>
                  <p className={`text-[10px] font-bold ${(selectedCoin.price_change_percentage_30d_in_currency || 0) >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                    {(selectedCoin.price_change_percentage_30d_in_currency || 0) >= 0 ? "+" : ""}{(selectedCoin.price_change_percentage_30d_in_currency || 0).toFixed(1)}%
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TradingView Chart - MAXIMUM SIZE */}
        <div
          ref={chartWrapperRef}
          className={`bg-[#111827] border border-white/[0.06] rounded-xl overflow-hidden mb-3 relative ${isFullscreen ? "fixed inset-0 z-50 rounded-none" : ""}`}
        >
          <div className="absolute top-2 right-2 z-20 flex gap-2">
            <div className="bg-black/60 backdrop-blur-sm rounded-lg px-2 py-1 text-[10px] text-cyan-400 font-bold">
              {selectedCoin?.symbol.toUpperCase()}/USDT
            </div>
            <button
              onClick={toggleFullscreen}
              className="bg-black/60 backdrop-blur-sm rounded-lg px-2 py-1 text-[10px] text-gray-400 hover:text-white transition-colors flex items-center gap-1"
            >
              <Maximize2 className="w-3 h-3" />
              {isFullscreen ? "Quitter" : "Plein écran"}
            </button>
          </div>
          <div
            ref={tvContainerRef}
            className="tradingview-widget-container"
            style={{
              height: isFullscreen ? "100vh" : "calc(100vh - 240px)",
              minHeight: isFullscreen ? "100vh" : "700px",
              width: "100%",
            }}
          />
        </div>

        {/* Top 200 Table */}
        <div className="bg-[#111827] border border-white/[0.06] rounded-xl p-4">
          <h3 className="text-sm font-bold mb-2">📊 Top 200 Cryptos — Cliquez pour voir le graphique</h3>
          <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
            <table className="w-full min-w-[600px]">
              <thead className="sticky top-0 bg-[#111827] z-10">
                <tr className="border-b border-white/10">
                  {["#", "Token", "Prix", "24h", "7j", "30j", "Vol 24h"].map((h) => (
                    <th key={h} className="text-left text-[9px] text-gray-500 uppercase tracking-wider py-1.5 px-2">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {coins.map((c, i) => (
                  <tr
                    key={c.id}
                    onClick={() => setSelected(c.id)}
                    className={`border-b border-white/5 cursor-pointer transition-colors ${
                      selected === c.id ? "bg-cyan-500/10" : "hover:bg-white/[0.03]"
                    }`}
                  >
                    <td className="py-1.5 px-2 text-[9px] text-gray-500">{i + 1}</td>
                    <td className="py-1.5 px-2">
                      <div className="flex items-center gap-1.5">
                        {c.image && <img src={c.image} alt={c.symbol} className="w-4 h-4 rounded-full" />}
                        <span className="font-bold text-[10px] text-white">{c.symbol.toUpperCase()}</span>
                        <span className="text-[9px] text-gray-500 truncate max-w-[60px]">{c.name}</span>
                      </div>
                    </td>
                    <td className="py-1.5 px-2 font-mono text-[10px] text-white">${formatPrice(c.current_price)}</td>
                    <td className={`py-1.5 px-2 font-mono text-[10px] font-bold ${(c.price_change_percentage_24h || 0) >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                      {(c.price_change_percentage_24h || 0) >= 0 ? "+" : ""}{(c.price_change_percentage_24h || 0).toFixed(2)}%
                    </td>
                    <td className={`py-1.5 px-2 font-mono text-[9px] ${(c.price_change_percentage_7d_in_currency || 0) >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                      {(c.price_change_percentage_7d_in_currency || 0) >= 0 ? "+" : ""}{(c.price_change_percentage_7d_in_currency || 0).toFixed(1)}%
                    </td>
                    <td className={`py-1.5 px-2 font-mono text-[9px] ${(c.price_change_percentage_30d_in_currency || 0) >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                      {(c.price_change_percentage_30d_in_currency || 0) >= 0 ? "+" : ""}{(c.price_change_percentage_30d_in_currency || 0).toFixed(1)}%
                    </td>
                    <td className="py-1.5 px-2 font-mono text-[9px] text-gray-400">
                      {c.total_volume >= 1e9 ? `$${(c.total_volume / 1e9).toFixed(1)}B` : `$${(c.total_volume / 1e6).toFixed(0)}M`}
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