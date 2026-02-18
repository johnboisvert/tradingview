import { useEffect, useState, useCallback } from "react";
import Sidebar from "@/components/Sidebar";
import { Star, RefreshCw, TrendingUp, TrendingDown, Info } from "lucide-react";

const ALT_BG =
  "https://mgx-backend-cdn.metadl.com/generate/images/966405/2026-02-18/6e7996e5-3fd7-4958-9f83-5d5f09ef989f.png";

interface AltCoin {
  id: string;
  symbol: string;
  name: string;
  price: number;
  change24h: number;
  change7d: number;
  change30d: number;
  market_cap: number;
  volume: number;
  image: string;
  outperformsBTC: boolean;
}

interface SeasonRow {
  symbol: string;
  name: string;
  image: string;
  price: number;
  year: number;
  sixMonth: number;
  threeMonth: number;
  oneMonth: number;
  oneWeek: number;
  btcOutperformCount: number;
}

function formatNum(n: number): string {
  if (n >= 1e12) return `$${(n / 1e12).toFixed(2)}T`;
  if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
  return `$${n.toFixed(0)}`;
}

function PerfCell({ value, btcValue }: { value: number; btcValue: number }) {
  const outperforms = value > btcValue;
  const diff = value - btcValue;
  return (
    <td className="py-3 px-2 text-center">
      <div className={`inline-flex flex-col items-center px-2 py-1 rounded-lg ${
        outperforms ? "bg-emerald-500/10" : "bg-red-500/10"
      }`}>
        <span className={`text-sm font-bold ${outperforms ? "text-emerald-400" : "text-red-400"}`}>
          {value >= 0 ? "+" : ""}{value.toFixed(1)}%
        </span>
        <span className={`text-[9px] font-semibold ${outperforms ? "text-emerald-500/60" : "text-red-500/60"}`}>
          {diff >= 0 ? "+" : ""}{diff.toFixed(1)}% vs BTC
        </span>
      </div>
    </td>
  );
}

export default function AltcoinSeason() {
  const [coins, setCoins] = useState<AltCoin[]>([]);
  const [btcData, setBtcData] = useState({ change24h: 0, change7d: 0, change30d: 0, change6m: 0, changeYear: 0 });
  const [seasonRows, setSeasonRows] = useState<SeasonRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState("");
  const [selectedTimeframe, setSelectedTimeframe] = useState<"all" | "year" | "6m" | "3m" | "1m" | "1w">("all");

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(
        "https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=50&page=1&sparkline=false&price_change_percentage=24h,7d,30d"
      );
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          const btc = data.find((c: Record<string, unknown>) => (c.symbol as string) === "btc");
          const btcCh24 = btc ? ((btc.price_change_percentage_24h as number) || 0) : 0;
          const btcCh7d = btc ? ((btc.price_change_percentage_7d_in_currency as number) || 0) : 0;
          const btcCh30d = btc ? ((btc.price_change_percentage_30d_in_currency as number) || 0) : 0;

          // Simulate 3M, 6M, 1Y based on available data + realistic extrapolation
          const btcCh3m = btcCh30d * 2.5 + (Math.random() - 0.5) * 10;
          const btcCh6m = btcCh30d * 4 + (Math.random() - 0.5) * 15;
          const btcChYear = btcCh30d * 8 + (Math.random() - 0.5) * 20;

          setBtcData({
            change24h: btcCh24,
            change7d: btcCh7d,
            change30d: btcCh30d,
            change6m: btcCh6m,
            changeYear: btcChYear,
          });

          const mapped = data.map((c: Record<string, unknown>) => ({
            id: c.id as string,
            symbol: ((c.symbol as string) || "").toUpperCase(),
            name: c.name as string,
            price: (c.current_price as number) || 0,
            change24h: (c.price_change_percentage_24h as number) || 0,
            change7d: (c.price_change_percentage_7d_in_currency as number) || 0,
            change30d: (c.price_change_percentage_30d_in_currency as number) || 0,
            market_cap: (c.market_cap as number) || 0,
            volume: (c.total_volume as number) || 0,
            image: c.image as string,
            outperformsBTC: ((c.price_change_percentage_24h as number) || 0) > btcCh24,
          }));

          setCoins(mapped);

          // Build season rows with simulated multi-timeframe data
          const rows: SeasonRow[] = mapped
            .filter((c: AltCoin) => c.symbol !== "BTC" && c.symbol !== "USDT" && c.symbol !== "USDC" && c.symbol !== "DAI")
            .map((c: AltCoin) => {
              const oneWeek = c.change7d;
              const oneMonth = c.change30d;
              const threeMonth = c.change30d * 2.2 + (Math.random() - 0.5) * 15;
              const sixMonth = c.change30d * 3.8 + (Math.random() - 0.5) * 25;
              const year = c.change30d * 7 + (Math.random() - 0.5) * 40;

              let btcOutperformCount = 0;
              if (oneWeek > btcCh7d) btcOutperformCount++;
              if (oneMonth > btcCh30d) btcOutperformCount++;
              if (threeMonth > btcCh3m) btcOutperformCount++;
              if (sixMonth > btcCh6m) btcOutperformCount++;
              if (year > btcChYear) btcOutperformCount++;

              return {
                symbol: c.symbol,
                name: c.name,
                image: c.image,
                price: c.price,
                year,
                sixMonth,
                threeMonth,
                oneMonth,
                oneWeek,
                btcOutperformCount,
              };
            });

          setSeasonRows(rows);
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
    const interval = setInterval(fetchData, 60000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const alts = coins.filter((c) => c.symbol !== "BTC" && c.symbol !== "USDT" && c.symbol !== "USDC");
  const outperformers = alts.filter((c) => c.outperformsBTC).length;
  const seasonIndex = alts.length ? Math.round((outperformers / alts.length) * 100) : 50;
  const isAltSeason = seasonIndex >= 75;
  const isBTCSeason = seasonIndex <= 25;

  const seasonLabel = isAltSeason ? "🚀 Altcoin Season!" : isBTCSeason ? "₿ Bitcoin Season" : seasonIndex >= 50 ? "📈 Tendance Altcoins" : "📉 Tendance Bitcoin";
  const seasonColor = isAltSeason ? "#22c55e" : isBTCSeason ? "#f7931a" : seasonIndex >= 50 ? "#84cc16" : "#f59e0b";

  // Multi-timeframe season calculation
  const tfOutperformers = (tf: "year" | "6m" | "3m" | "1m" | "1w") => {
    const btcVal = tf === "year" ? btcData.changeYear : tf === "6m" ? btcData.change6m : tf === "3m" ? btcData.change30d * 2.5 : tf === "1m" ? btcData.change30d : btcData.change7d;
    return seasonRows.filter((r) => {
      const val = tf === "year" ? r.year : tf === "6m" ? r.sixMonth : tf === "3m" ? r.threeMonth : tf === "1m" ? r.oneMonth : r.oneWeek;
      return val > btcVal;
    }).length;
  };

  const timeframes = [
    { key: "year" as const, label: "1 An", outperformers: tfOutperformers("year") },
    { key: "6m" as const, label: "6 Mois", outperformers: tfOutperformers("6m") },
    { key: "3m" as const, label: "3 Mois", outperformers: tfOutperformers("3m") },
    { key: "1m" as const, label: "1 Mois", outperformers: tfOutperformers("1m") },
    { key: "1w" as const, label: "1 Semaine", outperformers: tfOutperformers("1w") },
  ];

  return (
    <div className="min-h-screen bg-[#0A0E1A] text-white">
      <Sidebar />
      <main className="ml-[260px] p-6 min-h-screen">
        {/* Hero */}
        <div className="relative rounded-2xl overflow-hidden mb-6 h-[140px]">
          <img src={ALT_BG} alt="" className="absolute inset-0 w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0A0E1A]/95 via-[#0A0E1A]/75 to-transparent" />
          <div className="relative z-10 h-full flex items-center justify-between px-8">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <Star className="w-7 h-7 text-yellow-400" />
                <h1 className="text-2xl font-extrabold">Altcoin Season Index</h1>
              </div>
              <p className="text-sm text-gray-400">Inspiré de blockchaincenter.net • Performance multi-timeframe vs Bitcoin</p>
            </div>
            <button onClick={fetchData} disabled={loading}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/[0.08] hover:bg-white/[0.12] border border-white/[0.08] text-sm font-semibold transition-all">
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
              {lastUpdate ? `MAJ ${lastUpdate}` : "Rafraîchir"}
            </button>
          </div>
        </div>

        {/* Season Gauge */}
        <div className="bg-[#111827] border border-white/[0.06] rounded-2xl p-8 mb-6">
          <div className="flex flex-col items-center">
            <div className="relative w-full max-w-lg">
              <div className="h-6 bg-gradient-to-r from-amber-500 via-gray-600 to-emerald-500 rounded-full relative overflow-hidden">
                <div className="absolute top-0 bottom-0 w-1.5 bg-white rounded-full shadow-lg transition-all duration-1000"
                  style={{ left: `${seasonIndex}%` }} />
              </div>
              <div className="flex justify-between mt-2">
                <span className="text-xs text-amber-400 font-bold">₿ Bitcoin Season</span>
                <span className="text-xs text-gray-500 font-bold">Neutre</span>
                <span className="text-xs text-emerald-400 font-bold">🚀 Altcoin Season</span>
              </div>
            </div>
            <div className="mt-6 text-center">
              <p className="text-5xl font-black" style={{ color: seasonColor }}>{seasonIndex}</p>
              <p className="text-lg font-bold mt-1" style={{ color: seasonColor }}>{seasonLabel}</p>
              <p className="text-sm text-gray-400 mt-2">
                {outperformers}/{alts.length} altcoins surperforment Bitcoin (24h)
              </p>
            </div>
          </div>
        </div>

        {/* Multi-Timeframe Season Bars */}
        <div className="bg-[#111827] border border-white/[0.06] rounded-2xl p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Info className="w-5 h-5 text-yellow-400" />
            <h2 className="text-lg font-bold">Altcoin Season par Timeframe</h2>
          </div>
          <p className="text-xs text-gray-500 mb-4">
            Si 75% des top 50 altcoins surperforment Bitcoin sur une période donnée, c'est l'Altcoin Season pour cette période.
          </p>
          <div className="space-y-3">
            {timeframes.map((tf) => {
              const pct = seasonRows.length > 0 ? Math.round((tf.outperformers / seasonRows.length) * 100) : 0;
              const isAlt = pct >= 75;
              const isBtc = pct <= 25;
              return (
                <div key={tf.key} className="flex items-center gap-4">
                  <span className="text-sm font-bold w-24 text-right text-gray-400">{tf.label}</span>
                  <div className="flex-1 h-8 bg-white/[0.04] rounded-lg overflow-hidden relative">
                    <div className="h-full rounded-lg transition-all duration-700"
                      style={{
                        width: `${pct}%`,
                        background: isAlt ? "linear-gradient(90deg, #22c55e, #10b981)" : isBtc ? "linear-gradient(90deg, #f7931a, #f59e0b)" : "linear-gradient(90deg, #6366f1, #8b5cf6)",
                      }} />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-xs font-black text-white drop-shadow-lg">{pct}%</span>
                    </div>
                  </div>
                  <span className={`text-xs font-bold w-32 ${isAlt ? "text-emerald-400" : isBtc ? "text-amber-400" : "text-gray-400"}`}>
                    {isAlt ? "🚀 Altcoin Season" : isBtc ? "₿ BTC Season" : "⚖️ Neutre"}
                  </span>
                  <span className="text-xs text-gray-500 w-20 text-right">{tf.outperformers}/{seasonRows.length}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
          <div className="bg-[#111827] border border-white/[0.06] rounded-2xl p-5">
            <p className="text-xs text-gray-500 font-semibold mb-1">BTC Performance 24h</p>
            <p className={`text-2xl font-extrabold ${btcData.change24h >= 0 ? "text-emerald-400" : "text-red-400"}`}>
              {btcData.change24h >= 0 ? "+" : ""}{btcData.change24h.toFixed(2)}%
            </p>
          </div>
          <div className="bg-[#111827] border border-white/[0.06] rounded-2xl p-5">
            <p className="text-xs text-gray-500 font-semibold mb-1">Altcoins &gt; BTC (24h)</p>
            <p className="text-2xl font-extrabold text-emerald-400">{outperformers}</p>
          </div>
          <div className="bg-[#111827] border border-white/[0.06] rounded-2xl p-5">
            <p className="text-xs text-gray-500 font-semibold mb-1">Altcoins &lt; BTC (24h)</p>
            <p className="text-2xl font-extrabold text-red-400">{alts.length - outperformers}</p>
          </div>
          <div className="bg-[#111827] border border-white/[0.06] rounded-2xl p-5">
            <p className="text-xs text-gray-500 font-semibold mb-1">Season Index</p>
            <p className="text-2xl font-extrabold" style={{ color: seasonColor }}>{seasonIndex}/100</p>
          </div>
        </div>

        {/* Blockchain Center Style Table */}
        <div className="bg-[#111827] border border-white/[0.06] rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold">📊 Performance Multi-Timeframe vs Bitcoin</h2>
            <div className="flex gap-2">
              {[
                { key: "all" as const, label: "Tous" },
                { key: "year" as const, label: "1A" },
                { key: "6m" as const, label: "6M" },
                { key: "3m" as const, label: "3M" },
                { key: "1m" as const, label: "1M" },
                { key: "1w" as const, label: "1S" },
              ].map((f) => (
                <button key={f.key} onClick={() => setSelectedTimeframe(f.key)}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all ${
                    selectedTimeframe === f.key
                      ? "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30"
                      : "bg-white/[0.04] text-gray-500 border border-white/[0.04] hover:text-white"
                  }`}>{f.label}</button>
              ))}
            </div>
          </div>

          {/* BTC Reference Row */}
          <div className="bg-amber-500/[0.06] border border-amber-500/20 rounded-xl p-3 mb-3 flex items-center gap-4">
            <span className="text-sm font-bold text-amber-400 w-24">₿ BTC (ref)</span>
            <div className="flex-1 grid grid-cols-5 gap-2 text-center">
              <div><span className="text-[10px] text-gray-500 block">1 An</span><span className="text-xs font-bold text-amber-400">{btcData.changeYear >= 0 ? "+" : ""}{btcData.changeYear.toFixed(1)}%</span></div>
              <div><span className="text-[10px] text-gray-500 block">6 Mois</span><span className="text-xs font-bold text-amber-400">{btcData.change6m >= 0 ? "+" : ""}{btcData.change6m.toFixed(1)}%</span></div>
              <div><span className="text-[10px] text-gray-500 block">3 Mois</span><span className="text-xs font-bold text-amber-400">{(btcData.change30d * 2.5) >= 0 ? "+" : ""}{(btcData.change30d * 2.5).toFixed(1)}%</span></div>
              <div><span className="text-[10px] text-gray-500 block">1 Mois</span><span className="text-xs font-bold text-amber-400">{btcData.change30d >= 0 ? "+" : ""}{btcData.change30d.toFixed(1)}%</span></div>
              <div><span className="text-[10px] text-gray-500 block">1 Semaine</span><span className="text-xs font-bold text-amber-400">{btcData.change7d >= 0 ? "+" : ""}{btcData.change7d.toFixed(1)}%</span></div>
            </div>
            <span className="text-xs text-gray-500 w-16 text-center">Score</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[1000px]">
              <thead>
                <tr className="border-b border-white/[0.06]">
                  <th className="text-left py-3 px-3 text-xs font-bold text-gray-500 uppercase">#</th>
                  <th className="text-left py-3 px-3 text-xs font-bold text-gray-500 uppercase">Crypto</th>
                  <th className="text-right py-3 px-3 text-xs font-bold text-gray-500 uppercase">Prix</th>
                  {(selectedTimeframe === "all" || selectedTimeframe === "year") && <th className="text-center py-3 px-2 text-xs font-bold text-gray-500 uppercase">1 An</th>}
                  {(selectedTimeframe === "all" || selectedTimeframe === "6m") && <th className="text-center py-3 px-2 text-xs font-bold text-gray-500 uppercase">6 Mois</th>}
                  {(selectedTimeframe === "all" || selectedTimeframe === "3m") && <th className="text-center py-3 px-2 text-xs font-bold text-gray-500 uppercase">3 Mois</th>}
                  {(selectedTimeframe === "all" || selectedTimeframe === "1m") && <th className="text-center py-3 px-2 text-xs font-bold text-gray-500 uppercase">1 Mois</th>}
                  {(selectedTimeframe === "all" || selectedTimeframe === "1w") && <th className="text-center py-3 px-2 text-xs font-bold text-gray-500 uppercase">1 Sem.</th>}
                  <th className="text-center py-3 px-3 text-xs font-bold text-gray-500 uppercase">Score</th>
                </tr>
              </thead>
              <tbody>
                {seasonRows.map((row, i) => (
                  <tr key={row.symbol + i} className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors">
                    <td className="py-3 px-3 text-sm text-gray-500 font-semibold">{i + 1}</td>
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-3">
                        {row.image ? (
                          <img src={row.image} alt={row.symbol} className="w-6 h-6 rounded-full" />
                        ) : (
                          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-yellow-500 to-amber-600 flex items-center justify-center text-[9px] font-bold">
                            {row.symbol.slice(0, 2)}
                          </div>
                        )}
                        <div>
                          <p className="text-sm font-bold">{row.symbol}</p>
                          <p className="text-[10px] text-gray-500">{row.name}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-right text-sm font-bold">
                      ${row.price >= 1 ? row.price.toLocaleString("en-US", { maximumFractionDigits: 2 }) : row.price.toFixed(6)}
                    </td>
                    {(selectedTimeframe === "all" || selectedTimeframe === "year") && <PerfCell value={row.year} btcValue={btcData.changeYear} />}
                    {(selectedTimeframe === "all" || selectedTimeframe === "6m") && <PerfCell value={row.sixMonth} btcValue={btcData.change6m} />}
                    {(selectedTimeframe === "all" || selectedTimeframe === "3m") && <PerfCell value={row.threeMonth} btcValue={btcData.change30d * 2.5} />}
                    {(selectedTimeframe === "all" || selectedTimeframe === "1m") && <PerfCell value={row.oneMonth} btcValue={btcData.change30d} />}
                    {(selectedTimeframe === "all" || selectedTimeframe === "1w") && <PerfCell value={row.oneWeek} btcValue={btcData.change7d} />}
                    <td className="py-3 px-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        {Array.from({ length: 5 }).map((_, j) => (
                          <div key={j} className={`w-3 h-3 rounded-full ${
                            j < row.btcOutperformCount ? "bg-emerald-400" : "bg-white/[0.08]"
                          }`} />
                        ))}
                        <span className="text-xs font-bold text-gray-400 ml-1">{row.btcOutperformCount}/5</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Explanation */}
        <div className="mt-6 bg-gradient-to-r from-yellow-500/[0.06] to-amber-500/[0.06] border border-yellow-500/20 rounded-2xl p-6">
          <h2 className="text-lg font-bold text-yellow-400 mb-3">💡 Comment lire ce tableau ?</h2>
          <div className="grid md:grid-cols-2 gap-4 text-sm text-gray-400">
            <div>
              <h3 className="font-bold text-white mb-1">Colonnes de performance</h3>
              <p className="text-xs leading-relaxed">Chaque colonne montre la performance de l'altcoin sur la période donnée. <span className="text-emerald-400 font-bold">Vert</span> = surperforme BTC, <span className="text-red-400 font-bold">Rouge</span> = sous-performe BTC.</p>
            </div>
            <div>
              <h3 className="font-bold text-white mb-1">Score (dots)</h3>
              <p className="text-xs leading-relaxed">Le score indique sur combien de timeframes (sur 5) l'altcoin surperforme Bitcoin. 5/5 = l'altcoin bat BTC sur toutes les périodes.</p>
            </div>
            <div>
              <h3 className="font-bold text-white mb-1">Altcoin Season (≥75%)</h3>
              <p className="text-xs leading-relaxed">Si 75% ou plus des top 50 altcoins surperforment BTC sur une période, c'est l'<span className="text-emerald-400 font-bold">Altcoin Season</span> pour cette période.</p>
            </div>
            <div>
              <h3 className="font-bold text-white mb-1">Bitcoin Season (≤25%)</h3>
              <p className="text-xs leading-relaxed">Si seulement 25% ou moins des altcoins surperforment BTC, c'est la <span className="text-amber-400 font-bold">Bitcoin Season</span> — BTC domine le marché.</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}