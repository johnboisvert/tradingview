import { useEffect, useState, useCallback, useRef } from "react";
import Sidebar from "@/components/Sidebar";
import { RefreshCw, TrendingUp, TrendingDown, Search, Maximize2, Minimize2 } from "lucide-react";
import { fetchTop200, formatPrice, type CoinMarketData } from "@/lib/cryptoApi";

// TradingView symbol mapping for top coins
const TV_SYMBOLS: Record<string, string> = {
  bitcoin: "BINANCE:BTCUSDT",
  ethereum: "BINANCE:ETHUSDT",
  tether: "BINANCE:USDTUSD",
  ripple: "BINANCE:XRPUSDT",
  binancecoin: "BINANCE:BNBUSDT",
  solana: "BINANCE:SOLUSDT",
  dogecoin: "BINANCE:DOGEUSDT",
  cardano: "BINANCE:ADAUSDT",
  "staked-ether": "BINANCE:ETHUSDT",
  tron: "BINANCE:TRXUSDT",
  chainlink: "BINANCE:LINKUSDT",
  avalanche: "BINANCE:AVAXUSDT",
  "shiba-inu": "BINANCE:SHIBUSDT",
  polkadot: "BINANCE:DOTUSDT",
  "bitcoin-cash": "BINANCE:BCHUSDT",
  uniswap: "BINANCE:UNIUSDT",
  litecoin: "BINANCE:LTCUSDT",
  near: "BINANCE:NEARUSDT",
  polygon: "BINANCE:MATICUSDT",
  stellar: "BINANCE:XLMUSDT",
  aptos: "BINANCE:APTUSDT",
  "internet-computer": "BINANCE:ICPUSDT",
  "render-token": "BINANCE:RENDERUSDT",
  filecoin: "BINANCE:FILUSDT",
  cosmos: "BINANCE:ATOMUSDT",
  arbitrum: "BINANCE:ARBUSDT",
  optimism: "BINANCE:OPUSDT",
  injective: "BINANCE:INJUSDT",
  sui: "BINANCE:SUIUSDT",
  "sei-network": "BINANCE:SEIUSDT",
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

  // Load TradingView widget when selected coin changes
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
      <main className="ml-[260px] p-6 min-h-screen">
        {/* Hero */}
        <div className="relative rounded-2xl overflow-hidden mb-6 h-[100px] bg-gradient-to-r from-cyan-900/40 to-blue-900/40">
          <div className="absolute inset-0 bg-gradient-to-r from-[#0A0E1A]/90 via-[#0A0E1A]/60 to-transparent" />
          <div className="relative z-10 h-full flex items-center justify-between px-8">
            <div>
              <h1 className="text-2xl font-extrabold flex items-center gap-3">
                📈 Graphiques Avancés
              </h1>
              <p className="text-sm text-gray-400">
                Chandelles TradingView • RSI • MACD • Top 200 cryptos en temps réel
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

        {/* Search + Coin Selector */}
        <div className="bg-[#111827] border border-white/[0.06] rounded-2xl p-4 mb-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Rechercher une crypto..."
                className="w-full pl-9 pr-3 py-2 rounded-lg bg-black/30 border border-white/[0.08] text-sm text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500/50"
              />
            </div>
            <span className="text-xs text-gray-500">{coins.length} cryptos chargées</span>
          </div>
          <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto">
            {filteredCoins.slice(0, 200).map((c) => (
              <button
                key={c.id}
                onClick={() => { setSelected(c.id); setSearchQuery(""); }}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition-all ${
                  selected === c.id
                    ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30"
                    : "bg-white/[0.03] text-gray-400 border border-white/[0.04] hover:bg-white/[0.06]"
                }`}
              >
                {c.image && <img src={c.image} alt={c.symbol} className="w-4 h-4 rounded-full" />}
                {c.symbol.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        {/* Selected Coin Info */}
        {selectedCoin && (
          <div className="bg-[#111827] border border-white/[0.06] rounded-2xl p-4 mb-4">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-4">
                {selectedCoin.image && (
                  <img src={selectedCoin.image} alt={selectedCoin.symbol} className="w-10 h-10 rounded-full" />
                )}
                <div>
                  <h2 className="text-xl font-extrabold">
                    {selectedCoin.name} ({selectedCoin.symbol.toUpperCase()})
                  </h2>
                  <p className="text-xs text-gray-500">Rang #{selectedCoin.market_cap_rank}</p>
                </div>
                <div className="ml-4">
                  <p className="text-2xl font-extrabold">${formatPrice(selectedCoin.current_price)}</p>
                  <p className={`text-sm font-bold flex items-center gap-1 ${selectedCoin.price_change_percentage_24h >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                    {selectedCoin.price_change_percentage_24h >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                    {selectedCoin.price_change_percentage_24h >= 0 ? "+" : ""}
                    {(selectedCoin.price_change_percentage_24h || 0).toFixed(2)}% (24h)
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-6 text-center">
                <div>
                  <p className="text-[10px] text-gray-500 uppercase font-bold">7j</p>
                  <p className={`text-sm font-bold ${(selectedCoin.price_change_percentage_7d_in_currency || 0) >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                    {(selectedCoin.price_change_percentage_7d_in_currency || 0) >= 0 ? "+" : ""}
                    {(selectedCoin.price_change_percentage_7d_in_currency || 0).toFixed(1)}%
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-gray-500 uppercase font-bold">30j</p>
                  <p className={`text-sm font-bold ${(selectedCoin.price_change_percentage_30d_in_currency || 0) >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                    {(selectedCoin.price_change_percentage_30d_in_currency || 0) >= 0 ? "+" : ""}
                    {(selectedCoin.price_change_percentage_30d_in_currency || 0).toFixed(1)}%
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-gray-500 uppercase font-bold">ATH</p>
                  <p className="text-sm font-bold text-gray-400">
                    {(selectedCoin.ath_change_percentage || 0).toFixed(1)}%
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TradingView Chart - MUCH LARGER */}
        <div className={`bg-[#111827] border border-white/[0.06] rounded-2xl overflow-hidden mb-6 transition-all duration-300 ${
          isFullscreen ? "fixed inset-0 z-50 rounded-none m-0" : ""
        }`}>
          <div className="flex items-center justify-between px-4 py-2 border-b border-white/[0.06]">
            <div className="flex items-center gap-2">
              {selectedCoin?.image && <img src={selectedCoin.image} alt="" className="w-5 h-5 rounded-full" />}
              <span className="text-sm font-bold">{selectedCoin?.symbol.toUpperCase()}/USDT</span>
              <span className="text-xs text-gray-500">TradingView</span>
            </div>
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] text-xs font-semibold transition-all"
            >
              {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
              {isFullscreen ? "Réduire" : "Plein écran"}
            </button>
          </div>
          <div
            ref={tvContainerRef}
            className="tradingview-widget-container"
            style={{
              height: isFullscreen ? "calc(100vh - 44px)" : "calc(100vh - 380px)",
              minHeight: isFullscreen ? "auto" : "600px",
              width: "100%",
            }}
          />
        </div>

        {/* Top 200 Table */}
        {!isFullscreen && (
          <div className="bg-[#111827] border border-white/[0.06] rounded-2xl p-5">
            <h3 className="text-lg font-bold mb-4">📊 Top 200 Cryptos — Cliquez pour voir le graphique</h3>
            <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
              <table className="w-full min-w-[800px]">
                <thead className="sticky top-0 bg-[#111827] z-10">
                  <tr className="border-b border-white/10">
                    {["#", "Token", "Prix", "24h", "7j", "30j", "Volume 24h"].map((h) => (
                      <th key={h} className="text-left text-xs text-gray-500 uppercase tracking-wider py-3 px-3">{h}</th>
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
                      <td className="py-2.5 px-3 text-xs text-gray-500">{i + 1}</td>
                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-2">
                          {c.image && <img src={c.image} alt={c.symbol} className="w-5 h-5 rounded-full" />}
                          <span className="font-bold text-sm text-white">{c.symbol.toUpperCase()}</span>
                          <span className="text-xs text-gray-500 truncate max-w-[100px]">{c.name}</span>
                        </div>
                      </td>
                      <td className="py-2.5 px-3 font-mono text-sm text-white">${formatPrice(c.current_price)}</td>
                      <td className={`py-2.5 px-3 font-mono text-sm font-bold ${(c.price_change_percentage_24h || 0) >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                        {(c.price_change_percentage_24h || 0) >= 0 ? "+" : ""}{(c.price_change_percentage_24h || 0).toFixed(2)}%
                      </td>
                      <td className={`py-2.5 px-3 font-mono text-xs ${(c.price_change_percentage_7d_in_currency || 0) >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                        {(c.price_change_percentage_7d_in_currency || 0) >= 0 ? "+" : ""}{(c.price_change_percentage_7d_in_currency || 0).toFixed(1)}%
                      </td>
                      <td className={`py-2.5 px-3 font-mono text-xs ${(c.price_change_percentage_30d_in_currency || 0) >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                        {(c.price_change_percentage_30d_in_currency || 0) >= 0 ? "+" : ""}{(c.price_change_percentage_30d_in_currency || 0).toFixed(1)}%
                      </td>
                      <td className="py-2.5 px-3 font-mono text-xs text-gray-400">
                        {c.total_volume >= 1e9 ? `$${(c.total_volume / 1e9).toFixed(1)}B` : `$${(c.total_volume / 1e6).toFixed(0)}M`}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}