import { useEffect, useState, useCallback, useRef } from "react";
import Sidebar from "@/components/Sidebar";
import { RefreshCw } from "lucide-react";

interface CoinPerf {
  id: string;
  symbol: string;
  name: string;
  image: string;
  price: number;
  change24h: number;
  change7d: number;
  change30d: number;
  marketCap: number;
}

function getSeasonInfo(v: number) {
  if (v <= 25) return { label: "BITCOIN SEASON", color: "#f7931a", emoji: "🟠" };
  if (v <= 40) return { label: "BTC DOMINANT", color: "#f59e0b", emoji: "🟡" };
  if (v <= 60) return { label: "NEUTRE", color: "#94a3b8", emoji: "⚖️" };
  if (v <= 75) return { label: "ALT TENDANCE", color: "#84cc16", emoji: "🟢" };
  return { label: "ALTCOIN SEASON", color: "#22c55e", emoji: "🚀" };
}

const EXCLUDED = [
  "tether", "usd-coin", "dai", "binance-usd", "true-usd", "paxos-standard",
  "usdd", "frax", "wrapped-bitcoin", "staked-ether", "lido-staked-ether",
  "wrapped-steth", "rocket-pool-eth", "coinbase-wrapped-staked-eth",
  "first-digital-usd", "ethena-usde", "usual-usd", "paypal-usd",
];

export default function AltcoinSeason() {
  const [coins, setCoins] = useState<CoinPerf[]>([]);
  const [btcPerf, setBtcPerf] = useState({ change24h: 0, change7d: 0, change30d: 0 });
  const [seasonIndex, setSeasonIndex] = useState(50);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState("");
  const [timeframe, setTimeframe] = useState<"season" | "month" | "year">("season");
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imagesRef = useRef<Map<string, HTMLImageElement>>(new Map());

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(
        "https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=100&page=1&sparkline=false&price_change_percentage=24h,7d,30d"
      );
      if (!res.ok) throw new Error("API error");
      const data = await res.json();
      if (!Array.isArray(data) || data.length === 0) throw new Error("No data");

      const btcData = data.find((c: Record<string, unknown>) => c.id === "bitcoin");
      const btc24h = btcData?.price_change_percentage_24h_in_currency ?? btcData?.price_change_percentage_24h ?? 0;
      const btc7d = btcData?.price_change_percentage_7d_in_currency ?? 0;
      const btc30d = btcData?.price_change_percentage_30d_in_currency ?? 0;
      setBtcPerf({ change24h: btc24h, change7d: btc7d, change30d: btc30d });

      const filtered = data.filter(
        (c: Record<string, unknown>) =>
          !EXCLUDED.includes(c.id as string) && c.id !== "bitcoin"
      ).slice(0, 50);

      const mapped: CoinPerf[] = filtered.map((c: Record<string, unknown>) => ({
        id: c.id as string,
        symbol: ((c.symbol as string) || "").toUpperCase(),
        name: c.name as string,
        image: c.image as string,
        price: (c.current_price as number) || 0,
        change24h: (c.price_change_percentage_24h_in_currency as number) ?? (c.price_change_percentage_24h as number) ?? 0,
        change7d: (c.price_change_percentage_7d_in_currency as number) ?? 0,
        change30d: (c.price_change_percentage_30d_in_currency as number) ?? 0,
        marketCap: (c.market_cap as number) || 0,
      }));

      setCoins(mapped);

      const outperformers = mapped.filter((c) => c.change30d > btc30d).length;
      const idx = mapped.length > 0 ? Math.round((outperformers / mapped.length) * 100) : 50;
      setSeasonIndex(idx);

      // Preload coin images
      mapped.forEach((coin) => {
        if (coin.image && !imagesRef.current.has(coin.id)) {
          const img = new Image();
          img.crossOrigin = "anonymous";
          img.src = coin.image;
          imagesRef.current.set(coin.id, img);
        }
      });

      setLastUpdate(new Date().toLocaleTimeString("fr-FR"));
    } catch {
      // keep existing
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 120000);
    return () => clearInterval(interval);
  }, [fetchData]);

  function getBtcRef() {
    if (timeframe === "month") return btcPerf.change30d;
    if (timeframe === "year") return btcPerf.change30d;
    return btcPerf.change30d;
  }

  function getCoinPerf(c: CoinPerf) {
    if (timeframe === "month") return c.change30d;
    if (timeframe === "year") return c.change30d;
    return c.change30d;
  }

  // Draw the blockchaincenter-style horizontal bar chart on canvas
  useEffect(() => {
    if (!canvasRef.current || coins.length === 0) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const btcRef = getBtcRef();
    const sorted = [...coins].sort((a, b) => (getCoinPerf(b) - btcRef) - (getCoinPerf(a) - btcRef));

    const dpr = window.devicePixelRatio || 1;
    const barHeight = 28;
    const barGap = 3;
    const topPadding = 50;
    const bottomPadding = 30;
    const leftPadding = 120;
    const rightPadding = 80;
    const totalHeight = topPadding + sorted.length * (barHeight + barGap) + bottomPadding;

    const containerWidth = canvas.parentElement?.clientWidth || 800;
    canvas.style.width = containerWidth + "px";
    canvas.style.height = totalHeight + "px";
    canvas.width = containerWidth * dpr;
    canvas.height = totalHeight * dpr;
    ctx.scale(dpr, dpr);

    const W = containerWidth;
    const H = totalHeight;
    const chartW = W - leftPadding - rightPadding;
    const centerX = leftPadding + chartW / 2;

    // Clear
    ctx.clearRect(0, 0, W, H);

    // Background
    ctx.fillStyle = "rgba(15, 23, 42, 0.0)";
    ctx.fillRect(0, 0, W, H);

    // Title
    ctx.fillStyle = "#e2e8f0";
    ctx.font = "bold 16px Inter, system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(
      `Top 50 Performance vs Bitcoin — ${timeframe === "month" ? "30 jours" : timeframe === "year" ? "1 an" : "Saison (90j)"}`,
      W / 2,
      28
    );

    // Max absolute diff for scaling
    const maxAbsDiff = Math.max(
      ...sorted.map((c) => Math.abs(getCoinPerf(c) - btcRef)),
      1
    );

    // Center line (BTC reference = 0)
    ctx.strokeStyle = "rgba(148, 163, 184, 0.3)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(centerX, topPadding - 10);
    ctx.lineTo(centerX, H - bottomPadding);
    ctx.stroke();

    // Center label
    ctx.fillStyle = "#f7931a";
    ctx.font = "bold 11px Inter, system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("BTC", centerX, topPadding - 15);

    // Scale labels
    ctx.fillStyle = "#64748b";
    ctx.font = "10px Inter, system-ui, sans-serif";
    const scaleSteps = [-maxAbsDiff, -maxAbsDiff / 2, 0, maxAbsDiff / 2, maxAbsDiff];
    scaleSteps.forEach((val) => {
      const x = centerX + (val / maxAbsDiff) * (chartW / 2);
      ctx.textAlign = "center";
      ctx.fillText(`${val >= 0 ? "+" : ""}${val.toFixed(0)}%`, x, topPadding - 3);
    });

    // Draw bars
    sorted.forEach((coin, i) => {
      const y = topPadding + i * (barHeight + barGap);
      const diff = getCoinPerf(coin) - btcRef;
      const isPositive = diff >= 0;
      const barW = (Math.abs(diff) / maxAbsDiff) * (chartW / 2);

      // Coin label (left)
      const img = imagesRef.current.get(coin.id);
      if (img && img.complete && img.naturalWidth > 0) {
        try {
          ctx.drawImage(img, 4, y + 4, 20, 20);
        } catch {
          // skip image
        }
      }

      ctx.fillStyle = "#e2e8f0";
      ctx.font = "bold 11px Inter, system-ui, sans-serif";
      ctx.textAlign = "left";
      ctx.fillText(coin.symbol, 28, y + barHeight / 2 + 4);

      ctx.fillStyle = "#64748b";
      ctx.font = "10px Inter, system-ui, sans-serif";
      ctx.textAlign = "right";
      ctx.fillText(coin.name.length > 12 ? coin.name.slice(0, 12) + "…" : coin.name, leftPadding - 8, y + barHeight / 2 + 4);

      // Bar
      if (isPositive) {
        // Green bar going right from center
        const gradient = ctx.createLinearGradient(centerX, 0, centerX + barW, 0);
        gradient.addColorStop(0, "#22c55e");
        gradient.addColorStop(1, "#16a34a");
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.roundRect(centerX + 1, y + 2, barW, barHeight - 4, [0, 4, 4, 0]);
        ctx.fill();
      } else {
        // Red bar going left from center
        const gradient = ctx.createLinearGradient(centerX - barW, 0, centerX, 0);
        gradient.addColorStop(0, "#dc2626");
        gradient.addColorStop(1, "#ef4444");
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.roundRect(centerX - barW - 1, y + 2, barW, barHeight - 4, [4, 0, 0, 4]);
        ctx.fill();
      }

      // Value label on the bar end
      ctx.fillStyle = isPositive ? "#22c55e" : "#ef4444";
      ctx.font = "bold 11px Inter, system-ui, sans-serif";
      if (isPositive) {
        ctx.textAlign = "left";
        ctx.fillText(`+${diff.toFixed(1)}%`, centerX + barW + 6, y + barHeight / 2 + 4);
      } else {
        ctx.textAlign = "right";
        ctx.fillText(`${diff.toFixed(1)}%`, centerX - barW - 6, y + barHeight / 2 + 4);
      }

      // Subtle row separator
      ctx.strokeStyle = "rgba(148, 163, 184, 0.04)";
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      ctx.moveTo(leftPadding, y + barHeight + barGap / 2);
      ctx.lineTo(W - rightPadding, y + barHeight + barGap / 2);
      ctx.stroke();
    });

    // Legend at bottom
    ctx.font = "11px Inter, system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.fillStyle = "#22c55e";
    ctx.fillRect(W / 2 + 40, H - 18, 12, 12);
    ctx.fillStyle = "#94a3b8";
    ctx.fillText("Surperforme BTC", W / 2 + 100, H - 8);
    ctx.fillStyle = "#ef4444";
    ctx.fillRect(W / 2 - 120, H - 18, 12, 12);
    ctx.fillStyle = "#94a3b8";
    ctx.fillText("Sous-performe BTC", W / 2 - 60, H - 8);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [coins, timeframe, btcPerf]);

  const info = getSeasonInfo(seasonIndex);
  const btcRef = getBtcRef();
  const outperformCount = coins.filter((c) => getCoinPerf(c) > btcRef).length;
  const sortedCoins = [...coins].sort((a, b) => getCoinPerf(b) - getCoinPerf(a));

  return (
    <div className="min-h-screen bg-[#030712] text-white">
      <Sidebar />
      <main className="ml-[260px] min-h-screen relative">
        <div className="fixed top-0 left-[260px] right-0 bottom-0 pointer-events-none z-0 overflow-hidden">
          <div className="absolute w-[500px] h-[500px] rounded-full bg-[radial-gradient(circle,#22c55e,transparent)] top-[-150px] left-[-100px] opacity-[0.12] blur-[80px] animate-pulse" />
          <div className="absolute w-[400px] h-[400px] rounded-full bg-[radial-gradient(circle,#f7931a,transparent)] bottom-[-150px] right-[-50px] opacity-[0.12] blur-[80px] animate-pulse" style={{ animationDelay: "-10s" }} />
        </div>

        <div className="relative z-10 max-w-[1440px] mx-auto p-7 pb-20">
          {/* Header */}
          <div className="text-center mb-6 pt-10">
            <h1 className="text-[clamp(32px,5vw,48px)] font-black tracking-[-2px] bg-gradient-to-r from-[#f7931a] via-[#22c55e] to-[#6366f1] bg-clip-text text-transparent">
              Altcoin Season Index
            </h1>
          </div>

          {/* Tabs like blockchaincenter */}
          <div className="flex justify-center gap-1 mb-6">
            {[
              { key: "season" as const, label: "Altcoin Season", value: seasonIndex },
              { key: "month" as const, label: "Month", value: null },
              { key: "year" as const, label: "Year", value: null },
            ].map((t) => (
              <button
                key={t.key}
                onClick={() => setTimeframe(t.key)}
                className={`px-6 py-3 rounded-t-xl text-sm font-bold transition-all border-b-2 ${
                  timeframe === t.key
                    ? "bg-[rgba(15,23,42,0.85)] border-[#6366f1] text-white"
                    : "bg-[rgba(15,23,42,0.4)] border-transparent text-[#64748b] hover:text-white"
                }`}
              >
                {t.label} {t.value !== null && <span className="text-[#6366f1]">({t.value})</span>}
              </button>
            ))}
          </div>

          {/* Main Index Card */}
          <div className="bg-[rgba(15,23,42,0.85)] backdrop-blur-[24px] border border-[rgba(148,163,184,0.08)] rounded-3xl p-8 mb-6 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />

            <h2 className="text-xl font-bold mb-1">
              Altcoin Season Index{" "}
              <span className="text-[#64748b] text-sm font-normal">
                Si 75% des Top 50 coins surperforment Bitcoin sur la dernière saison (90 jours), c'est l'Altcoin Season
              </span>
            </h2>

            {loading && coins.length === 0 ? (
              <div className="flex justify-center items-center py-16">
                <div className="w-11 h-11 border-[3px] border-[rgba(99,102,241,0.15)] border-t-[#6366f1] rounded-full animate-spin" />
              </div>
            ) : (
              <div className="flex flex-col items-center py-6">
                <p className="text-[#94a3b8] text-lg font-bold mb-3">
                  {seasonIndex >= 75
                    ? "C'est l'Altcoin Season ! 🚀"
                    : seasonIndex <= 25
                    ? "C'est la Bitcoin Season !"
                    : "Ce n'est pas l'Altcoin Season."}
                </p>

                {/* Big number */}
                <p
                  className="font-mono text-[80px] font-black leading-none mb-4"
                  style={{ color: info.color, textShadow: `0 0 60px ${info.color}40` }}
                >
                  {seasonIndex}
                </p>

                {/* Gauge bar */}
                <div className="w-full max-w-[600px]">
                  <div className="h-8 rounded-xl relative overflow-hidden" style={{ background: "linear-gradient(90deg, #f7931a 0%, #eab308 25%, #94a3b8 50%, #84cc16 75%, #22c55e 100%)" }}>
                    {/* Indicator */}
                    <div
                      className="absolute top-[-4px] w-1.5 h-[calc(100%+8px)] bg-white rounded-sm shadow-[0_0_15px_rgba(255,255,255,0.6)] transition-all duration-[1500ms]"
                      style={{ left: `${seasonIndex}%` }}
                    />
                  </div>
                  <div className="flex justify-between mt-2 text-xs font-bold">
                    <span className="text-[#f7931a]">Bitcoin Season</span>
                    <span className="text-[#22c55e]">Altcoin Season</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Stats Table — like blockchaincenter */}
          <div className="bg-[rgba(15,23,42,0.85)] backdrop-blur-[24px] border border-[rgba(148,163,184,0.08)] rounded-3xl p-6 mb-6 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className="text-left py-2.5 px-4 text-xs text-[#64748b] font-bold uppercase tracking-wider border-b border-[rgba(148,163,184,0.1)]"></th>
                  <th className="text-center py-2.5 px-4 text-xs font-bold uppercase tracking-wider border-b border-[rgba(148,163,184,0.1)]">
                    <span className="text-[#22c55e]">Altcoin</span>
                  </th>
                  <th className="text-center py-2.5 px-4 text-xs font-bold uppercase tracking-wider border-b border-[rgba(148,163,184,0.1)]">
                    <span className="text-[#f7931a]">Bitcoin</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr className="hover:bg-[rgba(99,102,241,0.04)] transition-colors">
                  <td className="py-2.5 px-4 text-sm text-[#94a3b8]">Coins surperformant BTC (Top 50)</td>
                  <td className="py-2.5 px-4 text-sm text-center font-mono font-bold text-[#22c55e]">{outperformCount}</td>
                  <td className="py-2.5 px-4 text-sm text-center font-mono font-bold text-[#f7931a]">{coins.length - outperformCount}</td>
                </tr>
                <tr className="hover:bg-[rgba(99,102,241,0.04)] transition-colors">
                  <td className="py-2.5 px-4 text-sm text-[#94a3b8]">Performance moyenne (30j)</td>
                  <td className="py-2.5 px-4 text-sm text-center font-mono font-bold text-[#22c55e]">
                    {coins.length > 0 ? `${(coins.reduce((s, c) => s + getCoinPerf(c), 0) / coins.length).toFixed(1)}%` : "—"}
                  </td>
                  <td className="py-2.5 px-4 text-sm text-center font-mono font-bold text-[#f7931a]">
                    {btcRef >= 0 ? "+" : ""}{btcRef.toFixed(1)}%
                  </td>
                </tr>
                <tr className="hover:bg-[rgba(99,102,241,0.04)] transition-colors">
                  <td className="py-2.5 px-4 text-sm text-[#94a3b8]">Meilleur performer</td>
                  <td className="py-2.5 px-4 text-sm text-center font-mono font-bold text-[#22c55e]">
                    {sortedCoins.length > 0 ? `${sortedCoins[0].symbol} (${getCoinPerf(sortedCoins[0]) >= 0 ? "+" : ""}${getCoinPerf(sortedCoins[0]).toFixed(1)}%)` : "—"}
                  </td>
                  <td className="py-2.5 px-4 text-sm text-center font-mono font-bold text-[#f7931a]">—</td>
                </tr>
                <tr className="hover:bg-[rgba(99,102,241,0.04)] transition-colors">
                  <td className="py-2.5 px-4 text-sm text-[#94a3b8]">Pire performer</td>
                  <td className="py-2.5 px-4 text-sm text-center font-mono font-bold text-[#22c55e]">
                    {sortedCoins.length > 0 ? `${sortedCoins[sortedCoins.length - 1].symbol} (${getCoinPerf(sortedCoins[sortedCoins.length - 1]) >= 0 ? "+" : ""}${getCoinPerf(sortedCoins[sortedCoins.length - 1]).toFixed(1)}%)` : "—"}
                  </td>
                  <td className="py-2.5 px-4 text-sm text-center font-mono font-bold text-[#f7931a]">—</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Canvas Bar Chart — blockchaincenter style */}
          <div className="bg-[rgba(15,23,42,0.85)] backdrop-blur-[24px] border border-[rgba(148,163,184,0.08)] rounded-3xl p-6 mb-6 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
            <h3 className="text-lg font-extrabold mb-2">
              Top 50 Performance sur la dernière{" "}
              <span className="text-[#6366f1]">
                {timeframe === "month" ? "période (30 jours)" : timeframe === "year" ? "année" : "saison (90 jours)"}
              </span>
            </h3>
            <div className="overflow-x-auto">
              <canvas ref={canvasRef} />
            </div>
            <p className="text-[#64748b] text-xs mt-3 text-center">
              Si 75% des Top 50 coins surperforment Bitcoin sur la dernière saison (90 jours), c'est l'Altcoin Season.
              Exclus : Stablecoins (Tether, DAI…) et tokens adossés (WBTC, stETH, cLINK…)
            </p>
          </div>

          {/* Explanation */}
          <div className="bg-[rgba(15,23,42,0.85)] backdrop-blur-[24px] border border-[rgba(148,163,184,0.08)] rounded-3xl p-8 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
            <div className="flex items-center gap-2.5 text-lg font-extrabold mb-6">
              <span className="text-[22px]">📖</span> Comment ça marche ?
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div className="bg-gradient-to-br from-[rgba(15,23,42,0.85)] to-[rgba(30,41,59,0.5)] border border-[rgba(148,163,184,0.08)] rounded-2xl p-6">
                <h3 className="text-[15px] font-extrabold mb-3 text-[#f7931a]">🟠 Bitcoin Season (0-25)</h3>
                <p className="text-[#94a3b8] text-sm leading-relaxed">
                  La majorité des altcoins sous-performent Bitcoin. Les investisseurs se concentrent sur BTC comme valeur refuge. Moins de 25% des top 50 surperforment BTC.
                </p>
              </div>
              <div className="bg-gradient-to-br from-[rgba(15,23,42,0.85)] to-[rgba(30,41,59,0.5)] border border-[rgba(148,163,184,0.08)] rounded-2xl p-6">
                <h3 className="text-[15px] font-extrabold mb-3 text-[#eab308]">⚖️ Zone Neutre (25-75)</h3>
                <p className="text-[#94a3b8] text-sm leading-relaxed">
                  Pas de tendance claire. Le marché est partagé entre BTC et altcoins. Entre 25% et 75% des top 50 surperforment BTC.
                </p>
              </div>
              <div className="bg-gradient-to-br from-[rgba(15,23,42,0.85)] to-[rgba(30,41,59,0.5)] border border-[rgba(148,163,184,0.08)] rounded-2xl p-6">
                <h3 className="text-[15px] font-extrabold mb-3 text-[#22c55e]">🟢 Altcoin Season (75-100)</h3>
                <p className="text-[#94a3b8] text-sm leading-relaxed">
                  75%+ des top 50 altcoins surperforment BTC. C'est l'Altseason — les altcoins explosent ! Le moment où les altcoins brillent.
                </p>
              </div>
            </div>
          </div>

          {/* Refresh */}
          <button
            onClick={fetchData}
            disabled={loading}
            className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-5 py-3 rounded-2xl bg-[rgba(15,23,42,0.9)] backdrop-blur-xl border border-[rgba(148,163,184,0.15)] text-sm font-bold hover:border-[rgba(148,163,184,0.3)] transition-all shadow-2xl"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            {lastUpdate ? `MAJ ${lastUpdate}` : "Rafraîchir"}
          </button>
        </div>
      </main>
    </div>
  );
}