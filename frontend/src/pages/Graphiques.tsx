import Sidebar from "@/components/Sidebar";

export default function Graphiques() {
  return (
    <div className="min-h-screen bg-[#0A0E1A] flex">
      <Sidebar />
      <main className="flex-1 ml-[260px] p-8">
        <h1 className="text-3xl font-bold text-white mb-2">📊 Graphiques</h1>
        <p className="text-gray-400 mb-8">Graphiques interactifs avec TradingView</p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[
            { pair: "BTC/USDT", exchange: "Binance" },
            { pair: "ETH/USDT", exchange: "Binance" },
            { pair: "SOL/USDT", exchange: "Binance" },
            { pair: "BNB/USDT", exchange: "Binance" },
          ].map((chart, i) => (
            <div key={i} className="bg-[#111827] rounded-2xl border border-white/[0.06] overflow-hidden">
              <div className="p-4 border-b border-white/[0.06] flex items-center justify-between">
                <div>
                  <h3 className="text-white font-bold">{chart.pair}</h3>
                  <p className="text-gray-500 text-xs">{chart.exchange}</p>
                </div>
                <div className="flex gap-2">
                  {["1H", "4H", "1D", "1W"].map((tf) => (
                    <button key={tf} className="px-2 py-1 rounded-lg bg-white/[0.05] text-gray-400 text-xs font-semibold hover:bg-white/[0.1] hover:text-white transition-colors">
                      {tf}
                    </button>
                  ))}
                </div>
              </div>
              <div className="h-64 flex items-center justify-center bg-[#0d1117]">
                <iframe
                  src={`https://s.tradingview.com/widgetembed/?frameElementId=tv_${i}&symbol=BINANCE:${chart.pair.replace("/", "")}&interval=60&theme=dark&style=1&locale=fr&hide_top_toolbar=1&hide_legend=1&save_image=0&hide_volume=1`}
                  className="w-full h-full border-0"
                  title={chart.pair}
                  loading="lazy"
                />
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}