import Sidebar from "@/components/Sidebar";

const CRYPTO_DATA = [
  { name: "BTC", change: 2.4, mcap: 1200, size: "large" },
  { name: "ETH", change: -1.2, mcap: 400, size: "large" },
  { name: "BNB", change: 3.1, mcap: 85, size: "medium" },
  { name: "SOL", change: 8.5, mcap: 75, size: "medium" },
  { name: "XRP", change: -0.8, mcap: 65, size: "medium" },
  { name: "ADA", change: 4.2, mcap: 30, size: "small" },
  { name: "AVAX", change: -3.5, mcap: 25, size: "small" },
  { name: "DOT", change: 1.8, mcap: 20, size: "small" },
  { name: "LINK", change: 5.6, mcap: 18, size: "small" },
  { name: "MATIC", change: -2.1, mcap: 15, size: "small" },
  { name: "NEAR", change: 7.3, mcap: 12, size: "small" },
  { name: "INJ", change: 12.4, mcap: 10, size: "small" },
  { name: "APT", change: -4.2, mcap: 9, size: "small" },
  { name: "ARB", change: 3.8, mcap: 8, size: "small" },
  { name: "OP", change: 6.1, mcap: 7, size: "small" },
  { name: "SUI", change: -1.5, mcap: 6, size: "small" },
  { name: "FET", change: 9.2, mcap: 5, size: "small" },
  { name: "RENDER", change: 4.7, mcap: 5, size: "small" },
  { name: "TIA", change: -5.3, mcap: 4, size: "small" },
  { name: "SEI", change: 2.9, mcap: 3, size: "small" },
];

function getHeatColor(change: number) {
  if (change >= 8) return "bg-emerald-500";
  if (change >= 4) return "bg-emerald-600/80";
  if (change >= 1) return "bg-emerald-700/60";
  if (change >= -1) return "bg-gray-700";
  if (change >= -4) return "bg-red-700/60";
  if (change >= -8) return "bg-red-600/80";
  return "bg-red-500";
}

function getSize(s: string) {
  if (s === "large") return "col-span-2 row-span-2";
  if (s === "medium") return "col-span-1 row-span-2";
  return "col-span-1 row-span-1";
}

export default function Heatmap() {
  return (
    <div className="min-h-screen bg-[#0A0E1A] flex">
      <Sidebar />
      <main className="flex-1 ml-[260px] p-8">
        <h1 className="text-3xl font-bold text-white mb-2">🔥 Heatmap Crypto</h1>
        <p className="text-gray-400 mb-8">Visualisation en temps réel des performances du marché</p>

        <div className="grid grid-cols-6 gap-2 auto-rows-[80px]">
          {CRYPTO_DATA.map((c, i) => (
            <div key={i} className={`${getSize(c.size)} ${getHeatColor(c.change)} rounded-xl p-3 flex flex-col items-center justify-center cursor-pointer hover:opacity-80 transition-opacity border border-white/[0.06]`}>
              <span className="text-white font-bold text-lg">{c.name}</span>
              <span className={`text-sm font-semibold ${c.change >= 0 ? "text-white" : "text-red-200"}`}>
                {c.change >= 0 ? "+" : ""}{c.change}%
              </span>
              {c.size !== "small" && (
                <span className="text-white/60 text-xs mt-1">${c.mcap}B</span>
              )}
            </div>
          ))}
        </div>

        {/* Legend */}
        <div className="mt-6 flex items-center justify-center gap-4 flex-wrap">
          {[
            { label: "< -8%", cls: "bg-red-500" },
            { label: "-4% à -8%", cls: "bg-red-600/80" },
            { label: "-1% à -4%", cls: "bg-red-700/60" },
            { label: "Neutre", cls: "bg-gray-700" },
            { label: "+1% à +4%", cls: "bg-emerald-700/60" },
            { label: "+4% à +8%", cls: "bg-emerald-600/80" },
            { label: "> +8%", cls: "bg-emerald-500" },
          ].map((l, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className={`w-4 h-4 rounded ${l.cls}`} />
              <span className="text-gray-400 text-xs">{l.label}</span>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}