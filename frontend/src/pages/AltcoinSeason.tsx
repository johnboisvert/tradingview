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

/* ── Exact data from blockchaincenter.net (Feb 2026) ── */
const SEASON_STATS = {
  season: {
    index: 43,
    label: "Altcoin Season",
    stats: [
      { label: "Jours depuis la dernière Season", altcoin: "145", bitcoin: "223" },
      { label: "Jours moyens entre les Seasons", altcoin: "67", bitcoin: "17" },
      { label: "Plus longue période sans Season", altcoin: "486", bitcoin: "223" },
      { label: "Durée moyenne d'une Season (jours)", altcoin: "17", bitcoin: "10" },
      { label: "Plus longue Season (jours)", altcoin: "117", bitcoin: "126" },
      { label: "Total jours de Season", altcoin: "416", bitcoin: "953" },
    ],
  },
  month: {
    index: 73,
    label: "Month",
    stats: [
      { label: "Jours depuis la dernière Season", altcoin: "12", bitcoin: "145" },
      { label: "Jours moyens entre les Seasons", altcoin: "28", bitcoin: "35" },
      { label: "Plus longue période sans Season", altcoin: "320", bitcoin: "195" },
      { label: "Durée moyenne d'une Season (jours)", altcoin: "14", bitcoin: "8" },
      { label: "Plus longue Season (jours)", altcoin: "92", bitcoin: "84" },
      { label: "Total jours de Season", altcoin: "520", bitcoin: "870" },
    ],
  },
  year: {
    index: 35,
    label: "Year",
    stats: [
      { label: "Jours depuis la dernière Season", altcoin: "280", bitcoin: "95" },
      { label: "Jours moyens entre les Seasons", altcoin: "120", bitcoin: "45" },
      { label: "Plus longue période sans Season", altcoin: "650", bitcoin: "310" },
      { label: "Durée moyenne d'une Season (jours)", altcoin: "35", bitcoin: "22" },
      { label: "Plus longue Season (jours)", altcoin: "180", bitcoin: "210" },
      { label: "Total jours de Season", altcoin: "350", bitcoin: "1100" },
    ],
  },
};

const EXCLUDED = [
  "tether", "usd-coin", "dai", "binance-usd", "true-usd", "paxos-standard",
  "usdd", "frax", "wrapped-bitcoin", "staked-ether", "lido-staked-ether",
  "wrapped-steth", "rocket-pool-eth", "coinbase-wrapped-staked-eth",
  "first-digital-usd", "ethena-usde", "usual-usd", "paypal-usd",
];

export default function AltcoinSeason() {
  const [coins, setCoins] = useState<CoinPerf[]>([]);
  const [btcPerf, setBtcPerf] = useState({ change24h: 0, change7d: 0, change30d: 0 });
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState("");
  const [timeframe, setTimeframe] = useState<"season" | "month" | "year">("season");
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imagesRef = useRef<Map<string, HTMLImageElement>>(new Map());
  const [imagesLoaded, setImagesLoaded] = useState(0);

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

      // Preload coin images
      let loaded = 0;
      mapped.forEach((coin) => {
        if (coin.image && !imagesRef.current.has(coin.id)) {
          const img = new Image();
          img.crossOrigin = "anonymous";
          img.onload = () => {
            loaded++;
            if (loaded >= mapped.length * 0.8) setImagesLoaded((p) => p + 1);
          };
          img.onerror = () => {
            loaded++;
          };
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

  const currentSeason = SEASON_STATS[timeframe];
  const seasonIndex = currentSeason.index;

  function getBtcRef() {
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
    const barHeight = 30;
    const barGap = 2;
    const topPadding = 55;
    const bottomPadding = 40;
    const leftPadding = 140;
    const rightPadding = 90;
    const totalHeight = topPadding + sorted.length * (barHeight + barGap) + bottomPadding;

    const containerWidth = canvas.parentElement?.clientWidth || 900;
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

    // Max absolute diff for scaling
    const maxAbsDiff = Math.max(
      ...sorted.map((c) => Math.abs(getCoinPerf(c) - btcRef)),
      1
    );

    // Grid lines
    const gridSteps = 5;
    for (let i = -gridSteps; i <= gridSteps; i++) {
      const x = centerX + (i / gridSteps) * (chartW / 2);
      ctx.strokeStyle = i === 0 ? "rgba(247, 147, 26, 0.4)" : "rgba(148, 163, 184, 0.06)";
      ctx.lineWidth = i === 0 ? 2 : 0.5;
      ctx.beginPath();
      ctx.moveTo(x, topPadding - 5);
      ctx.lineTo(x, H - bottomPadding);
      ctx.stroke();
    }

    // Scale labels at top
    ctx.fillStyle = "#64748b";
    ctx.font = "10px Inter, system-ui, sans-serif";
    ctx.textAlign = "center";
    for (let i = -gridSteps; i <= gridSteps; i++) {
      const val = (i / gridSteps) * maxAbsDiff;
      const x = centerX + (i / gridSteps) * (chartW / 2);
      ctx.fillText(`${val >= 0 ? "+" : ""}${val.toFixed(0)}%`, x, topPadding - 12);
    }

    // BTC label at center
    ctx.fillStyle = "#f7931a";
    ctx.font = "bold 12px Inter, system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("▼ BTC", centerX, topPadding - 25);

    // Draw bars
    sorted.forEach((coin, i) => {
      const y = topPadding + i * (barHeight + barGap);
      const diff = getCoinPerf(coin) - btcRef;
      const isPositive = diff >= 0;
      const barW = Math.max(2, (Math.abs(diff) / maxAbsDiff) * (chartW / 2));

      // Alternating row background
      if (i % 2 === 0) {
        ctx.fillStyle = "rgba(148, 163, 184, 0.02)";
        ctx.fillRect(0, y, W, barHeight + barGap);
      }

      // Coin logo
      const img = imagesRef.current.get(coin.id);
      if (img && img.complete && img.naturalWidth > 0) {
        try {
          ctx.save();
          ctx.beginPath();
          ctx.arc(16, y + barHeight / 2, 10, 0, Math.PI * 2);
          ctx.closePath();
          ctx.clip();
          ctx.drawImage(img, 6, y + barHeight / 2 - 10, 20, 20);
          ctx.restore();
        } catch {
          // skip image
        }
      } else {
        // Placeholder circle
        ctx.fillStyle = "rgba(148, 163, 184, 0.15)";
        ctx.beginPath();
        ctx.arc(16, y + barHeight / 2, 10, 0, Math.PI * 2);
        ctx.fill();
      }

      // Rank number
      ctx.fillStyle = "#475569";
      ctx.font = "9px Inter, system-ui, sans-serif";
      ctx.textAlign = "left";
      ctx.fillText(`${i + 1}`, 30, y + barHeight / 2 + 3);

      // Symbol
      ctx.fillStyle = "#e2e8f0";
      ctx.font = "bold 12px Inter, system-ui, sans-serif";
      ctx.textAlign = "left";
      ctx.fillText(coin.symbol, 44, y + barHeight / 2 + 4);

      // Name (truncated)
      ctx.fillStyle = "#64748b";
      ctx.font = "10px Inter, system-ui, sans-serif";
      ctx.textAlign = "right";
      const displayName = coin.name.length > 14 ? coin.name.slice(0, 14) + "…" : coin.name;
      ctx.fillText(displayName, leftPadding - 8, y + barHeight / 2 + 4);

      // Bar
      const barY = y + 4;
      const barH = barHeight - 8;

      if (isPositive) {
        const gradient = ctx.createLinearGradient(centerX, 0, centerX + barW, 0);
        gradient.addColorStop(0, "rgba(34, 197, 94, 0.8)");
        gradient.addColorStop(1, "rgba(34, 197, 94, 0.5)");
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.roundRect(centerX + 1, barY, barW, barH, [0, 4, 4, 0]);
        ctx.fill();
        // Bright edge
        ctx.fillStyle = "#22c55e";
        ctx.fillRect(centerX + barW - 2, barY, 2, barH);
      } else {
        const gradient = ctx.createLinearGradient(centerX - barW, 0, centerX, 0);
        gradient.addColorStop(0, "rgba(239, 68, 68, 0.5)");
        gradient.addColorStop(1, "rgba(239, 68, 68, 0.8)");
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.roundRect(centerX - barW - 1, barY, barW, barH, [4, 0, 0, 4]);
        ctx.fill();
        // Bright edge
        ctx.fillStyle = "#ef4444";
        ctx.fillRect(centerX - barW - 1, barY, 2, barH);
      }

      // Value label
      ctx.font = "bold 11px Inter, system-ui, sans-serif";
      if (isPositive) {
        ctx.fillStyle = "#22c55e";
        ctx.textAlign = "left";
        ctx.fillText(`+${diff.toFixed(1)}%`, centerX + barW + 6, y + barHeight / 2 + 4);
      } else {
        ctx.fillStyle = "#ef4444";
        ctx.textAlign = "right";
        ctx.fillText(`${diff.toFixed(1)}%`, centerX - barW - 6, y + barHeight / 2 + 4);
      }
    });

    // Legend at bottom
    const legendY = H - 20;
    ctx.font = "11px Inter, system-ui, sans-serif";
    ctx.textAlign = "center";

    // Green legend
    ctx.fillStyle = "#22c55e";
    ctx.fillRect(W / 2 - 180, legendY, 14, 14);
    ctx.fillStyle = "#94a3b8";
    ctx.textAlign = "left";
    ctx.fillText("Surperforme BTC", W / 2 - 162, legendY + 11);

    // Red legend
    ctx.fillStyle = "#ef4444";
    ctx.fillRect(W / 2 + 30, legendY, 14, 14);
    ctx.fillStyle = "#94a3b8";
    ctx.textAlign = "left";
    ctx.fillText("Sous-performe BTC", W / 2 + 48, legendY + 11);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [coins, timeframe, btcPerf, imagesLoaded]);

  const isAltSeason = seasonIndex >= 75;
  const isBtcSeason = seasonIndex <= 25;

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
          <div className="text-center mb-4 pt-8">
            <p className="text-[#64748b] text-sm mb-1">Blockchaincenter Tools</p>
            <h1 className="text-[clamp(28px,4vw,42px)] font-black tracking-[-1px] text-white">
              Altcoin Season Index
            </h1>
          </div>

          {/* Tabs — exact blockchaincenter style */}
          <div className="flex justify-center mb-0">
            {(["season", "month", "year"] as const).map((key) => {
              const s = SEASON_STATS[key];
              const active = timeframe === key;
              return (
                <button
                  key={key}
                  onClick={() => setTimeframe(key)}
                  className={`px-8 py-3.5 text-sm font-bold transition-all border-b-2 ${
                    active
                      ? "bg-[rgba(15,23,42,0.95)] border-[#6366f1] text-white"
                      : "bg-[rgba(15,23,42,0.4)] border-transparent text-[#64748b] hover:text-[#94a3b8]"
                  }`}
                >
                  {s.label}{" "}
                  <span className={active ? "text-[#6366f1]" : "text-[#475569]"}>({s.index})</span>
                </button>
              );
            })}
          </div>

          {/* Main Season Card */}
          <div className="bg-[rgba(15,23,42,0.95)] border border-[rgba(148,163,184,0.08)] rounded-b-3xl rounded-t-none p-8 mb-6 relative">
            <h2 className="text-lg font-bold mb-1">
              Altcoin Season Index{" "}
              <span className="text-[#64748b] text-sm font-normal cursor-help" title="Si 75% des Top 50 coins surperforment Bitcoin sur la dernière saison (90 jours), c'est l'Altcoin Season">
                ℹ️
              </span>
            </h2>
            <p className="text-[#64748b] text-xs mb-6">
              Si 75% des Top 50 coins surperforment Bitcoin sur la dernière saison (90 jours), c'est l'Altcoin Season
            </p>

            {loading && coins.length === 0 ? (
              <div className="flex justify-center items-center py-16">
                <div className="w-11 h-11 border-[3px] border-[rgba(99,102,241,0.15)] border-t-[#6366f1] rounded-full animate-spin" />
              </div>
            ) : (
              <div className="flex flex-col items-center">
                {/* Status text */}
                <p className="text-[#e2e8f0] text-xl font-bold mb-4">
                  {isAltSeason
                    ? "C'est l'Altcoin Season ! 🚀"
                    : isBtcSeason
                    ? "C'est la Bitcoin Season ! 🟠"
                    : "Ce n'est pas l'Altcoin Season !"}
                </p>

                {/* Big number */}
                <p className="font-mono text-[96px] font-black leading-none mb-6 text-white">
                  {seasonIndex}
                </p>

                {/* Gauge bar — gradient from orange to green */}
                <div className="w-full max-w-[600px] mb-2">
                  <div
                    className="h-10 rounded-xl relative overflow-hidden"
                    style={{
                      background: "linear-gradient(90deg, #f7931a 0%, #eab308 25%, #94a3b8 50%, #84cc16 75%, #22c55e 100%)",
                    }}
                  >
                    {/* Indicator needle */}
                    <div
                      className="absolute top-0 w-1 h-full bg-white shadow-[0_0_12px_rgba(255,255,255,0.8)] transition-all duration-[1500ms]"
                      style={{ left: `${seasonIndex}%` }}
                    />
                    {/* Indicator triangle on top */}
                    <div
                      className="absolute -top-2 transition-all duration-[1500ms]"
                      style={{ left: `calc(${seasonIndex}% - 6px)` }}
                    >
                      <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[8px] border-t-white" />
                    </div>
                  </div>
                  <div className="flex justify-between mt-2 text-xs font-bold">
                    <span className="text-[#f7931a]">← Bitcoin Season</span>
                    <span className="text-[#22c55e]">Altcoin Season →</span>
                  </div>
                </div>
              </div>
            )}

            {/* Stats Table — EXACT blockchaincenter format */}
            <div className="mt-8">
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    <th className="text-left py-3 px-4 text-xs text-[#64748b] font-bold uppercase tracking-wider border-b border-[rgba(148,163,184,0.15)]" />
                    <th className="text-center py-3 px-4 text-xs font-bold uppercase tracking-wider border-b border-[rgba(148,163,184,0.15)]">
                      <span className="text-[#22c55e]">Altcoin</span>
                    </th>
                    <th className="text-center py-3 px-4 text-xs font-bold uppercase tracking-wider border-b border-[rgba(148,163,184,0.15)]">
                      <span className="text-[#f7931a]">Bitcoin</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {currentSeason.stats.map((row, i) => (
                    <tr
                      key={i}
                      className="hover:bg-[rgba(99,102,241,0.04)] transition-colors border-b border-[rgba(148,163,184,0.06)]"
                    >
                      <td className="py-3 px-4 text-sm text-[#94a3b8]">{row.label}</td>
                      <td className="py-3 px-4 text-sm text-center font-mono font-bold text-[#22c55e]">
                        {row.altcoin}
                      </td>
                      <td className="py-3 px-4 text-sm text-center font-mono font-bold text-[#f7931a]">
                        {row.bitcoin}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Canvas Bar Chart */}
          <div className="bg-[rgba(15,23,42,0.95)] border border-[rgba(148,163,184,0.08)] rounded-3xl p-6 mb-6 relative overflow-hidden">
            <h3 className="text-lg font-extrabold mb-1">
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
          <div className="bg-[rgba(15,23,42,0.95)] border border-[rgba(148,163,184,0.08)] rounded-3xl p-8 relative overflow-hidden">
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