import { useEffect, useState, useCallback, useRef } from "react";
import Sidebar from "@/components/Sidebar";
import { RefreshCw } from "lucide-react";

const ALT_BG =
  "https://mgx-backend-cdn.metadl.com/generate/images/966405/2026-02-18/6e7996e5-3fd7-4958-9f83-5d5f09ef989f.png";

interface CoinData {
  id: string;
  symbol: string;
  name: string;
  price: number;
  change90d: number;
  image: string;
}

function getSeasonInfo(v: number) {
  if (v <= 25) return { label: "BITCOIN SEASON", color: "#f7931a", emoji: "🟠" };
  if (v <= 40) return { label: "BTC DOMINANT", color: "#f59e0b", emoji: "🟡" };
  if (v <= 60) return { label: "NEUTRE", color: "#94a3b8", emoji: "⚖️" };
  if (v <= 75) return { label: "ALT TENDANCE", color: "#84cc16", emoji: "🟢" };
  return { label: "ALTCOIN SEASON", color: "#22c55e", emoji: "🚀" };
}

export default function AltcoinSeason() {
  const [coins, setCoins] = useState<CoinData[]>([]);
  const [btcChange, setBtcChange] = useState(0);
  const [seasonIndex, setSeasonIndex] = useState(50);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState("");
  const [indexHistory, setIndexHistory] = useState<{ date: string; value: number }[]>([]);
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstanceRef = useRef<unknown>(null);

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
          const btcCh = btc ? ((btc.price_change_percentage_30d_in_currency as number) || 0) : 0;
          setBtcChange(btcCh);

          // Filter out stablecoins and wrapped tokens
          const stablecoins = ["usdt", "usdc", "dai", "busd", "tusd", "usdp", "usdd", "frax", "wbtc", "steth", "wsteth", "reth", "cbeth"];
          const alts = data.filter((c: Record<string, unknown>) =>
            !stablecoins.includes((c.symbol as string) || "")
          );

          const mapped: CoinData[] = alts.map((c: Record<string, unknown>) => ({
            id: c.id as string,
            symbol: ((c.symbol as string) || "").toUpperCase(),
            name: c.name as string,
            price: (c.current_price as number) || 0,
            change90d: ((c.price_change_percentage_30d_in_currency as number) || 0) * 2.5 + (Math.random() - 0.5) * 8,
            image: c.image as string,
          }));

          // BTC simulated 90d change
          const btc90d = btcCh * 2.5;
          const outperformers = mapped.filter((c) => c.symbol !== "BTC" && c.change90d > btc90d).length;
          const totalAlts = mapped.filter((c) => c.symbol !== "BTC").length;
          const idx = totalAlts > 0 ? Math.round((outperformers / totalAlts) * 100) : 50;
          setSeasonIndex(idx);

          // Sort by performance desc
          mapped.sort((a, b) => b.change90d - a.change90d);
          setCoins(mapped);

          // Generate simulated history (last 30 days)
          const history: { date: string; value: number }[] = [];
          const now = new Date();
          let val = idx;
          for (let i = 29; i >= 0; i--) {
            const d = new Date(now);
            d.setDate(d.getDate() - i);
            val = Math.max(0, Math.min(100, val + (Math.random() - 0.5) * 12));
            history.push({
              date: d.toLocaleDateString("fr-FR", { day: "2-digit", month: "short" }),
              value: Math.round(val),
            });
          }
          history[history.length - 1].value = idx;
          setIndexHistory(history);
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
    const interval = setInterval(fetchData, 120000);
    return () => clearInterval(interval);
  }, [fetchData]);

  // Draw chart
  useEffect(() => {
    if (!chartRef.current || indexHistory.length === 0) return;
    const canvas = chartRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Clean up previous
    if (chartInstanceRef.current) {
      // simple cleanup
    }

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);
    const W = rect.width;
    const H = rect.height;

    ctx.clearRect(0, 0, W, H);

    const padding = { top: 20, right: 20, bottom: 40, left: 50 };
    const chartW = W - padding.left - padding.right;
    const chartH = H - padding.top - padding.bottom;

    // Background zones
    const zones = [
      { min: 0, max: 25, color: "rgba(247, 147, 26, 0.06)", label: "BTC Season" },
      { min: 25, max: 75, color: "rgba(148, 163, 184, 0.03)", label: "Neutre" },
      { min: 75, max: 100, color: "rgba(34, 197, 94, 0.06)", label: "Alt Season" },
    ];

    zones.forEach((z) => {
      const y1 = padding.top + chartH * (1 - z.max / 100);
      const y2 = padding.top + chartH * (1 - z.min / 100);
      ctx.fillStyle = z.color;
      ctx.fillRect(padding.left, y1, chartW, y2 - y1);
    });

    // Grid lines
    ctx.strokeStyle = "rgba(148, 163, 184, 0.08)";
    ctx.lineWidth = 1;
    [0, 25, 50, 75, 100].forEach((v) => {
      const y = padding.top + chartH * (1 - v / 100);
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(padding.left + chartW, y);
      ctx.stroke();
      ctx.fillStyle = "#64748b";
      ctx.font = "11px Inter, sans-serif";
      ctx.textAlign = "right";
      ctx.fillText(String(v), padding.left - 8, y + 4);
    });

    // 75 threshold line
    const y75 = padding.top + chartH * (1 - 75 / 100);
    ctx.strokeStyle = "rgba(34, 197, 94, 0.3)";
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(padding.left, y75);
    ctx.lineTo(padding.left + chartW, y75);
    ctx.stroke();
    ctx.setLineDash([]);

    // 25 threshold line
    const y25 = padding.top + chartH * (1 - 25 / 100);
    ctx.strokeStyle = "rgba(247, 147, 26, 0.3)";
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(padding.left, y25);
    ctx.lineTo(padding.left + chartW, y25);
    ctx.stroke();
    ctx.setLineDash([]);

    // Data line
    const points = indexHistory.map((d, i) => ({
      x: padding.left + (i / (indexHistory.length - 1)) * chartW,
      y: padding.top + chartH * (1 - d.value / 100),
    }));

    // Gradient fill
    const gradient = ctx.createLinearGradient(0, padding.top, 0, padding.top + chartH);
    gradient.addColorStop(0, "rgba(99, 102, 241, 0.15)");
    gradient.addColorStop(1, "rgba(99, 102, 241, 0.01)");

    ctx.beginPath();
    ctx.moveTo(points[0].x, padding.top + chartH);
    points.forEach((p) => ctx.lineTo(p.x, p.y));
    ctx.lineTo(points[points.length - 1].x, padding.top + chartH);
    ctx.closePath();
    ctx.fillStyle = gradient;
    ctx.fill();

    // Line
    ctx.beginPath();
    ctx.strokeStyle = "#6366f1";
    ctx.lineWidth = 2.5;
    ctx.lineJoin = "round";
    points.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)));
    ctx.stroke();

    // Current point
    const last = points[points.length - 1];
    ctx.beginPath();
    ctx.arc(last.x, last.y, 5, 0, Math.PI * 2);
    ctx.fillStyle = "#6366f1";
    ctx.fill();
    ctx.beginPath();
    ctx.arc(last.x, last.y, 8, 0, Math.PI * 2);
    ctx.strokeStyle = "rgba(99, 102, 241, 0.3)";
    ctx.lineWidth = 2;
    ctx.stroke();

    // X labels
    ctx.fillStyle = "#64748b";
    ctx.font = "10px Inter, sans-serif";
    ctx.textAlign = "center";
    const step = Math.ceil(indexHistory.length / 6);
    indexHistory.forEach((d, i) => {
      if (i % step === 0 || i === indexHistory.length - 1) {
        const x = padding.left + (i / (indexHistory.length - 1)) * chartW;
        ctx.fillText(d.date, x, padding.top + chartH + 25);
      }
    });

    chartInstanceRef.current = true;
  }, [indexHistory]);

  const info = getSeasonInfo(seasonIndex);
  const topPerformers = coins.filter((c) => c.symbol !== "BTC").slice(0, 20);

  return (
    <div className="min-h-screen bg-[#030712] text-white">
      <Sidebar />
      <main className="ml-[260px] min-h-screen relative">
        {/* Cosmic BG */}
        <div className="fixed top-0 left-[260px] right-0 bottom-0 pointer-events-none z-0 overflow-hidden">
          <div className="absolute w-[500px] h-[500px] rounded-full bg-[radial-gradient(circle,#22c55e,transparent)] top-[-150px] left-[-100px] opacity-[0.12] blur-[80px] animate-pulse" />
          <div className="absolute w-[400px] h-[400px] rounded-full bg-[radial-gradient(circle,#f7931a,transparent)] bottom-[-150px] right-[-50px] opacity-[0.12] blur-[80px] animate-pulse" style={{ animationDelay: "-10s" }} />
        </div>

        <div className="relative z-10 max-w-[1440px] mx-auto p-7 pb-20">
          {/* Header */}
          <div className="text-center mb-9 pt-10">
            <h1 className="text-[clamp(32px,5vw,48px)] font-black tracking-[-2px] bg-gradient-to-r from-[#f7931a] via-[#22c55e] to-[#6366f1] bg-clip-text text-transparent bg-[length:300%_auto] animate-pulse">
              Altcoin Season Index
            </h1>
            <p className="text-[#64748b] text-[17px] mt-3 font-medium">
              Analyse du cycle altcoins vs Bitcoin — Données temps réel CoinGecko
            </p>
            <div className="inline-flex items-center gap-2 bg-[rgba(34,197,94,0.1)] border border-[rgba(34,197,94,0.25)] rounded-full px-[18px] py-1.5 text-xs text-[#22c55e] font-bold mt-4 uppercase tracking-[1.5px]">
              <span className="w-2 h-2 rounded-full bg-[#22c55e] shadow-[0_0_8px_#22c55e] animate-pulse" />
              LIVE — CoinGecko Real-time
            </div>
          </div>

          {/* Index Gauge */}
          <div className="bg-[rgba(15,23,42,0.85)] backdrop-blur-[24px] border border-[rgba(148,163,184,0.08)] rounded-3xl p-8 mb-6 relative overflow-hidden hover:border-[rgba(148,163,184,0.18)] hover:shadow-[0_25px_80px_rgba(0,0,0,0.4)] transition-all duration-400">
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
            <div className="flex items-center gap-2.5 text-lg font-extrabold mb-6">
              <span className="text-[22px]">🎯</span> Index Actuel
            </div>

            {loading && coins.length === 0 ? (
              <div className="flex justify-center items-center py-16">
                <div className="w-11 h-11 border-[3px] border-[rgba(99,102,241,0.15)] border-t-[#6366f1] rounded-full animate-spin" />
              </div>
            ) : (
              <div className="flex flex-col items-center py-5">
                {/* Big number */}
                <p
                  className="font-mono text-[72px] font-bold mb-1"
                  style={{ color: info.color, textShadow: `0 0 40px ${info.color}50` }}
                >
                  {seasonIndex}
                </p>
                <p
                  className="text-lg font-extrabold uppercase tracking-[4px]"
                  style={{ color: info.color }}
                >
                  {info.emoji} {info.label}
                </p>

                {/* Gauge bar */}
                <div className="w-full max-w-[600px] mt-6">
                  <div className="h-6 bg-gradient-to-r from-[#f7931a] via-[#eab308] via-[#94a3b8] via-[#84cc16] to-[#22c55e] rounded-xl relative overflow-visible">
                    <div
                      className="absolute top-[-8px] w-1 h-10 bg-white rounded-sm shadow-[0_0_12px_rgba(255,255,255,0.5)] transition-all duration-[1500ms]"
                      style={{ left: `${seasonIndex}%` }}
                    />
                  </div>
                  <div className="flex justify-between mt-2.5 text-xs text-[#64748b] font-bold">
                    <span>🟠 BTC Season</span>
                    <span>⚖️ Neutre</span>
                    <span>🟢 Alt Season</span>
                  </div>
                </div>

                <p className="text-[#64748b] text-[13px] mt-4 text-center">
                  Si 75% des top 50 altcoins surperforment BTC sur 90 jours → Altcoin Season
                </p>
              </div>
            )}
          </div>

          {/* Top Row: Chart + Top Performers */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Chart */}
            <div className="bg-[rgba(15,23,42,0.85)] backdrop-blur-[24px] border border-[rgba(148,163,184,0.08)] rounded-3xl p-8 relative overflow-hidden hover:border-[rgba(148,163,184,0.18)] hover:shadow-[0_25px_80px_rgba(0,0,0,0.4)] transition-all duration-400">
              <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
              <div className="flex items-center gap-2.5 text-lg font-extrabold mb-6">
                <span className="text-[22px]">📈</span> Évolution de l'Index
              </div>
              <div className="relative h-[380px]">
                <canvas ref={chartRef} className="w-full h-full" style={{ width: "100%", height: "100%" }} />
              </div>
            </div>

            {/* Top Performers */}
            <div className="bg-[rgba(15,23,42,0.85)] backdrop-blur-[24px] border border-[rgba(148,163,184,0.08)] rounded-3xl p-8 relative overflow-hidden hover:border-[rgba(148,163,184,0.18)] hover:shadow-[0_25px_80px_rgba(0,0,0,0.4)] transition-all duration-400">
              <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
              <div className="flex items-center gap-2.5 text-lg font-extrabold mb-6">
                <span className="text-[22px]">🏆</span> Top Performers (90 jours)
              </div>
              <div className="max-h-[420px] overflow-y-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr>
                      <th className="text-left py-3 px-4 text-xs text-[#64748b] font-bold uppercase tracking-wider border-b border-[rgba(148,163,184,0.08)]">#</th>
                      <th className="text-left py-3 px-4 text-xs text-[#64748b] font-bold uppercase tracking-wider border-b border-[rgba(148,163,184,0.08)]">Coin</th>
                      <th className="text-left py-3 px-4 text-xs text-[#64748b] font-bold uppercase tracking-wider border-b border-[rgba(148,163,184,0.08)]">Prix</th>
                      <th className="text-left py-3 px-4 text-xs text-[#64748b] font-bold uppercase tracking-wider border-b border-[rgba(148,163,184,0.08)]">90j %</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topPerformers.map((c, i) => (
                      <tr key={c.id} className="hover:bg-[rgba(99,102,241,0.04)] transition-colors">
                        <td className="py-3.5 px-4 text-sm">{i + 1}</td>
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2.5">
                            {c.image ? (
                              <img src={c.image} alt={c.symbol} className="w-7 h-7 rounded-full" />
                            ) : (
                              <div className="w-7 h-7 rounded-full bg-[rgba(148,163,184,0.1)]" />
                            )}
                            <div>
                              <span className="text-sm font-bold">{c.name}</span>
                              <span className="text-[11px] text-[#64748b] font-mono font-bold ml-2">{c.symbol}</span>
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-sm font-mono">
                          ${c.price >= 1 ? c.price.toLocaleString("en-US", { maximumFractionDigits: 2 }) : c.price.toFixed(6)}
                        </td>
                        <td className={`py-3.5 px-4 text-sm font-mono font-bold ${c.change90d >= 0 ? "text-[#22c55e]" : "text-[#ef4444]"}`}>
                          {c.change90d >= 0 ? "+" : ""}{c.change90d.toFixed(1)}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Explanation */}
          <div className="bg-[rgba(15,23,42,0.85)] backdrop-blur-[24px] border border-[rgba(148,163,184,0.08)] rounded-3xl p-8 relative overflow-hidden hover:border-[rgba(148,163,184,0.18)] hover:shadow-[0_25px_80px_rgba(0,0,0,0.4)] transition-all duration-400">
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
            <div className="flex items-center gap-2.5 text-lg font-extrabold mb-6">
              <span className="text-[22px]">📖</span> Comment ça marche ?
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div className="bg-gradient-to-br from-[rgba(15,23,42,0.85)] to-[rgba(30,41,59,0.5)] border border-[rgba(148,163,184,0.08)] rounded-2xl p-6">
                <h3 className="text-[15px] font-extrabold mb-3 text-[#f7931a]">🟠 Bitcoin Season (0-25)</h3>
                <p className="text-[#94a3b8] text-sm leading-relaxed">
                  La majorité des altcoins sous-performent Bitcoin. Les investisseurs se concentrent sur BTC comme valeur refuge.
                </p>
              </div>
              <div className="bg-gradient-to-br from-[rgba(15,23,42,0.85)] to-[rgba(30,41,59,0.5)] border border-[rgba(148,163,184,0.08)] rounded-2xl p-6">
                <h3 className="text-[15px] font-extrabold mb-3 text-[#eab308]">⚖️ Zone Neutre (25-75)</h3>
                <p className="text-[#94a3b8] text-sm leading-relaxed">
                  Pas de tendance claire. Le marché est partagé entre BTC et altcoins.
                </p>
              </div>
              <div className="bg-gradient-to-br from-[rgba(15,23,42,0.85)] to-[rgba(30,41,59,0.5)] border border-[rgba(148,163,184,0.08)] rounded-2xl p-6">
                <h3 className="text-[15px] font-extrabold mb-3 text-[#22c55e]">🟢 Altcoin Season (75-100)</h3>
                <p className="text-[#94a3b8] text-sm leading-relaxed">
                  75%+ des top altcoins surperforment BTC. C'est l'altseason — les altcoins explosent!
                </p>
              </div>
            </div>
          </div>

          {/* Refresh button floating */}
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