import { useEffect, useState, useCallback, useRef } from "react";
import Sidebar from "@/components/Sidebar";
import { RefreshCw, ExternalLink } from "lucide-react";
import { fetchTop200, type CoinMarketData } from "@/lib/cryptoApi";

const STABLECOINS = new Set([
  "tether", "usd-coin", "dai", "binance-usd", "true-usd", "paxos-standard",
  "usdd", "frax", "wrapped-bitcoin", "staked-ether", "lido-staked-ether",
  "wrapped-steth", "rocket-pool-eth", "coinbase-wrapped-staked-eth",
  "first-digital-usd", "ethena-usde", "usual-usd", "paypal-usd",
]);

export default function AltcoinSeason() {
  const [coins, setCoins] = useState<CoinMarketData[]>([]);
  const [btcPerf, setBtcPerf] = useState({ change30d: 0 });
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState("");
  const [fetchError, setFetchError] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imagesRef = useRef<Map<string, HTMLImageElement>>(new Map());
  const [imagesLoaded, setImagesLoaded] = useState(0);
  const [viewMode, setViewMode] = useState<"live" | "reference">("live");

  const fetchData = useCallback(async () => {
    setLoading(true);
    setFetchError(false);
    try {
      const data = await fetchTop200(false);
      if (!data || data.length === 0) {
        setFetchError(true);
        setLoading(false);
        return;
      }
      const btcData = data.find((c) => c.id === "bitcoin");
      setBtcPerf({ change30d: btcData?.price_change_percentage_30d_in_currency ?? 0 });

      const filtered = data
        .filter((c) => !STABLECOINS.has(c.id) && c.id !== "bitcoin")
        .slice(0, 50);

      if (filtered.length === 0) {
        setFetchError(true);
        setLoading(false);
        return;
      }

      setCoins(filtered);

      // Preload images
      let loaded = 0;
      filtered.forEach((coin) => {
        if (coin.image && !imagesRef.current.has(coin.id)) {
          const img = new Image();
          img.crossOrigin = "anonymous";
          img.onload = () => { loaded++; if (loaded >= filtered.length * 0.7) setImagesLoaded((p) => p + 1); };
          img.onerror = () => { loaded++; };
          img.src = coin.image;
          imagesRef.current.set(coin.id, img);
        }
      });

      setLastUpdate(new Date().toLocaleTimeString("fr-FR"));
    } catch {
      setFetchError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 120000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const btcRef = btcPerf.change30d;
  const outperformCount = coins.filter((c) => (c.price_change_percentage_30d_in_currency ?? 0) > btcRef).length;
  const seasonIndex = coins.length > 0 ? Math.round((outperformCount / coins.length) * 100) : 50;
  const isAltSeason = seasonIndex >= 75;
  const isBtcSeason = seasonIndex <= 25;

  // Draw bar chart
  useEffect(() => {
    if (!canvasRef.current || coins.length === 0) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const sorted = [...coins].sort((a, b) => {
      const diffB = (b.price_change_percentage_30d_in_currency ?? 0) - btcRef;
      const diffA = (a.price_change_percentage_30d_in_currency ?? 0) - btcRef;
      return diffB - diffA;
    });

    const dpr = window.devicePixelRatio || 1;
    const barHeight = 28;
    const barGap = 2;
    const topPadding = 50;
    const bottomPadding = 40;
    const leftPadding = 130;
    const rightPadding = 80;
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

    ctx.clearRect(0, 0, W, H);

    const maxAbsDiff = Math.max(
      ...sorted.map((c) => Math.abs((c.price_change_percentage_30d_in_currency ?? 0) - btcRef)),
      1
    );

    // Grid
    for (let i = -5; i <= 5; i++) {
      const x = centerX + (i / 5) * (chartW / 2);
      ctx.strokeStyle = i === 0 ? "rgba(247, 147, 26, 0.4)" : "rgba(148, 163, 184, 0.06)";
      ctx.lineWidth = i === 0 ? 2 : 0.5;
      ctx.beginPath();
      ctx.moveTo(x, topPadding - 5);
      ctx.lineTo(x, H - bottomPadding);
      ctx.stroke();
    }

    // Grid labels
    ctx.fillStyle = "#64748b";
    ctx.font = "10px Inter, system-ui, sans-serif";
    ctx.textAlign = "center";
    for (let i = -5; i <= 5; i++) {
      const val = (i / 5) * maxAbsDiff;
      const x = centerX + (i / 5) * (chartW / 2);
      ctx.fillText(`${val >= 0 ? "+" : ""}${val.toFixed(0)}%`, x, topPadding - 12);
    }

    ctx.fillStyle = "#f7931a";
    ctx.font = "bold 12px Inter, system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("▼ BTC", centerX, topPadding - 25);

    // Bars
    sorted.forEach((coin, i) => {
      const y = topPadding + i * (barHeight + barGap);
      const diff = (coin.price_change_percentage_30d_in_currency ?? 0) - btcRef;
      const isPositive = diff >= 0;
      const barW = Math.max(2, (Math.abs(diff) / maxAbsDiff) * (chartW / 2));

      if (i % 2 === 0) {
        ctx.fillStyle = "rgba(148, 163, 184, 0.02)";
        ctx.fillRect(0, y, W, barHeight + barGap);
      }

      // Icon
      const img = imagesRef.current.get(coin.id);
      if (img && img.complete && img.naturalWidth > 0) {
        try {
          ctx.save();
          ctx.beginPath();
          ctx.arc(16, y + barHeight / 2, 9, 0, Math.PI * 2);
          ctx.closePath();
          ctx.clip();
          ctx.drawImage(img, 7, y + barHeight / 2 - 9, 18, 18);
          ctx.restore();
        } catch { /* skip */ }
      }

      ctx.fillStyle = "#475569";
      ctx.font = "9px Inter, system-ui, sans-serif";
      ctx.textAlign = "left";
      ctx.fillText(`${i + 1}`, 30, y + barHeight / 2 + 3);

      ctx.fillStyle = "#e2e8f0";
      ctx.font = "bold 11px Inter, system-ui, sans-serif";
      ctx.textAlign = "left";
      ctx.fillText(coin.symbol.toUpperCase(), 44, y + barHeight / 2 + 4);

      ctx.fillStyle = "#64748b";
      ctx.font = "10px Inter, system-ui, sans-serif";
      ctx.textAlign = "right";
      const name = coin.name.length > 12 ? coin.name.slice(0, 12) + "…" : coin.name;
      ctx.fillText(name, leftPadding - 8, y + barHeight / 2 + 4);

      const barY = y + 4;
      const barH = barHeight - 8;

      if (isPositive) {
        const grad = ctx.createLinearGradient(centerX, 0, centerX + barW, 0);
        grad.addColorStop(0, "rgba(34, 197, 94, 0.8)");
        grad.addColorStop(1, "rgba(34, 197, 94, 0.5)");
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.roundRect(centerX + 1, barY, barW, barH, [0, 4, 4, 0]);
        ctx.fill();
      } else {
        const grad = ctx.createLinearGradient(centerX - barW, 0, centerX, 0);
        grad.addColorStop(0, "rgba(239, 68, 68, 0.5)");
        grad.addColorStop(1, "rgba(239, 68, 68, 0.8)");
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.roundRect(centerX - barW - 1, barY, barW, barH, [4, 0, 0, 4]);
        ctx.fill();
      }

      ctx.font = "bold 10px Inter, system-ui, sans-serif";
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

    // Legend
    const ly = H - 20;
    ctx.font = "11px Inter, system-ui, sans-serif";
    ctx.fillStyle = "#22c55e";
    ctx.fillRect(W / 2 - 180, ly, 14, 14);
    ctx.fillStyle = "#94a3b8";
    ctx.textAlign = "left";
    ctx.fillText("Surperforme BTC", W / 2 - 162, ly + 11);
    ctx.fillStyle = "#ef4444";
    ctx.fillRect(W / 2 + 30, ly, 14, 14);
    ctx.fillStyle = "#94a3b8";
    ctx.fillText("Sous-performe BTC", W / 2 + 48, ly + 11);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [coins, btcPerf, imagesLoaded]);

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
          <div className="text-center mb-8 pt-8">
            <h1 className="text-[clamp(28px,4vw,42px)] font-black tracking-[-1px] bg-gradient-to-r from-[#22c55e] via-[#f7931a] to-[#22c55e] bg-clip-text text-transparent">
              🔄 Altcoin Season Index
            </h1>
            <p className="text-[#64748b] text-sm mt-2">
              Si 75% des Top 50 altcoins surperforment Bitcoin sur 30 jours, c&apos;est l&apos;Altcoin Season
            </p>
            <div className="inline-flex items-center gap-2 bg-[rgba(34,197,94,0.1)] border border-[rgba(34,197,94,0.25)] rounded-full px-5 py-1.5 text-xs text-[#22c55e] font-bold mt-3 uppercase tracking-widest">
              <span className="w-2 h-2 rounded-full bg-[#22c55e] shadow-[0_0_8px_#22c55e] animate-pulse" />
              LIVE — Données CoinGecko Top 200
            </div>
          </div>

          {/* View Mode Toggle */}
          <div className="flex justify-center gap-3 mb-6">
            <button
              onClick={() => setViewMode("live")}
              className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
                viewMode === "live"
                  ? "bg-[#22c55e]/20 text-[#22c55e] border border-[#22c55e]/30"
                  : "bg-white/[0.04] text-gray-400 border border-white/[0.06] hover:bg-white/[0.08]"
              }`}
            >
              📊 Données CoinGecko Live
            </button>
            <button
              onClick={() => setViewMode("reference")}
              className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
                viewMode === "reference"
                  ? "bg-[#6366f1]/20 text-[#818cf8] border border-[#6366f1]/30"
                  : "bg-white/[0.04] text-gray-400 border border-white/[0.06] hover:bg-white/[0.08]"
              }`}
            >
              🌐 BlockchainCenter Index
            </button>
          </div>

          {viewMode === "reference" ? (
            /* BlockchainCenter.net Altcoin Season Index - Real reference */
            <div className="bg-[rgba(15,23,42,0.95)] border border-[rgba(148,163,184,0.08)] rounded-3xl p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-extrabold flex items-center gap-2">
                  🌐 BlockchainCenter Altcoin Season Index
                </h3>
                <a
                  href="https://www.blockchaincenter.net/en/altcoin-season-index/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-xs text-[#818cf8] hover:text-[#a5b4fc] transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  Ouvrir sur BlockchainCenter
                </a>
              </div>
              <div className="rounded-2xl overflow-hidden bg-black/30" style={{ height: "700px" }}>
                <iframe
                  src="https://www.blockchaincenter.net/en/altcoin-season-index/"
                  title="Altcoin Season Index - BlockchainCenter"
                  className="w-full h-full border-0"
                  style={{ filter: "brightness(0.95)" }}
                  sandbox="allow-scripts allow-same-origin allow-popups"
                />
              </div>
              <p className="text-[#64748b] text-xs mt-3 text-center">
                Source: blockchaincenter.net — Index de référence mondial pour l&apos;Altcoin Season
              </p>
            </div>
          ) : (
            <>
              {/* Error state */}
              {fetchError && coins.length === 0 && (
                <div className="bg-[rgba(239,68,68,0.1)] border border-[rgba(239,68,68,0.2)] rounded-2xl p-6 mb-6 text-center">
                  <p className="text-red-400 font-bold mb-2">⚠️ Impossible de charger les données CoinGecko</p>
                  <p className="text-[#94a3b8] text-sm mb-4">
                    L&apos;API gratuite CoinGecko a des limites de requêtes. Essayez de rafraîchir dans 30 secondes ou consultez l&apos;index BlockchainCenter.
                  </p>
                  <div className="flex justify-center gap-3">
                    <button
                      onClick={fetchData}
                      className="px-4 py-2 rounded-xl bg-white/[0.08] hover:bg-white/[0.12] border border-white/[0.08] text-sm font-semibold transition-all"
                    >
                      <RefreshCw className="w-4 h-4 inline mr-2" />
                      Réessayer
                    </button>
                    <button
                      onClick={() => setViewMode("reference")}
                      className="px-4 py-2 rounded-xl bg-[#6366f1]/20 text-[#818cf8] border border-[#6366f1]/30 text-sm font-semibold transition-all hover:bg-[#6366f1]/30"
                    >
                      Voir BlockchainCenter Index
                    </button>
                  </div>
                </div>
              )}

              {/* Main Season Card */}
              <div className="bg-[rgba(15,23,42,0.95)] border border-[rgba(148,163,184,0.08)] rounded-3xl p-8 mb-6">
                {loading && coins.length === 0 ? (
                  <div className="flex justify-center items-center py-16">
                    <div className="w-11 h-11 border-[3px] border-[rgba(99,102,241,0.15)] border-t-[#6366f1] rounded-full animate-spin" />
                  </div>
                ) : coins.length > 0 ? (
                  <div className="flex flex-col items-center">
                    <p className="text-[#e2e8f0] text-xl font-bold mb-4">
                      {isAltSeason
                        ? "🚀 C'est l'Altcoin Season !"
                        : isBtcSeason
                        ? "🟠 C'est la Bitcoin Season !"
                        : "⚖️ Ce n'est pas l'Altcoin Season"}
                    </p>

                    <p className="font-mono text-[96px] font-black leading-none mb-6 text-white">
                      {seasonIndex}
                    </p>

                    {/* Gauge bar */}
                    <div className="w-full max-w-[600px] mb-4">
                      <div
                        className="h-10 rounded-xl relative overflow-hidden"
                        style={{
                          background: "linear-gradient(90deg, #f7931a 0%, #eab308 25%, #94a3b8 50%, #84cc16 75%, #22c55e 100%)",
                        }}
                      >
                        <div
                          className="absolute top-0 w-1 h-full bg-white shadow-[0_0_12px_rgba(255,255,255,0.8)] transition-all duration-[1500ms]"
                          style={{ left: `${seasonIndex}%` }}
                        />
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

                    <p className="text-[#94a3b8] text-sm">
                      <span className="text-[#22c55e] font-bold">{outperformCount}</span> sur{" "}
                      <span className="text-white font-bold">{coins.length}</span> altcoins surperforment BTC (30j)
                    </p>
                    <p className="text-[#64748b] text-xs mt-1">
                      BTC 30j: {btcPerf.change30d >= 0 ? "+" : ""}{btcPerf.change30d.toFixed(1)}%
                    </p>

                    {/* Top 50 altcoins performance table */}
                    <div className="w-full mt-6 overflow-x-auto max-h-[400px] overflow-y-auto">
                      <table className="w-full min-w-[600px]">
                        <thead className="sticky top-0 bg-[rgba(15,23,42,0.98)] z-10">
                          <tr className="border-b border-white/10">
                            <th className="text-left text-xs text-gray-500 uppercase py-2 px-3">#</th>
                            <th className="text-left text-xs text-gray-500 uppercase py-2 px-3">Altcoin</th>
                            <th className="text-right text-xs text-gray-500 uppercase py-2 px-3">Perf 30j</th>
                            <th className="text-right text-xs text-gray-500 uppercase py-2 px-3">vs BTC</th>
                            <th className="text-center text-xs text-gray-500 uppercase py-2 px-3">Statut</th>
                          </tr>
                        </thead>
                        <tbody>
                          {[...coins].sort((a, b) => {
                            const diffB = (b.price_change_percentage_30d_in_currency ?? 0) - btcRef;
                            const diffA = (a.price_change_percentage_30d_in_currency ?? 0) - btcRef;
                            return diffB - diffA;
                          }).map((coin, i) => {
                            const perf30d = coin.price_change_percentage_30d_in_currency ?? 0;
                            const diff = perf30d - btcRef;
                            const beats = diff > 0;
                            return (
                              <tr key={coin.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                                <td className="py-2 px-3 text-xs text-gray-500">{i + 1}</td>
                                <td className="py-2 px-3">
                                  <div className="flex items-center gap-2">
                                    {coin.image && <img src={coin.image} alt={coin.symbol} className="w-5 h-5 rounded-full" />}
                                    <span className="font-bold text-sm text-white">{coin.symbol.toUpperCase()}</span>
                                    <span className="text-xs text-gray-500 truncate max-w-[80px]">{coin.name}</span>
                                  </div>
                                </td>
                                <td className={`py-2 px-3 text-right font-mono text-sm font-bold ${perf30d >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                                  {perf30d >= 0 ? "+" : ""}{perf30d.toFixed(1)}%
                                </td>
                                <td className={`py-2 px-3 text-right font-mono text-sm font-bold ${beats ? "text-emerald-400" : "text-red-400"}`}>
                                  {diff >= 0 ? "+" : ""}{diff.toFixed(1)}%
                                </td>
                                <td className="py-2 px-3 text-center">
                                  <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                    beats
                                      ? "bg-emerald-500/20 text-emerald-400"
                                      : "bg-red-500/20 text-red-400"
                                  }`}>
                                    {beats ? "✓ Bat BTC" : "✗ Sous BTC"}
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : null}
              </div>

              {/* Bar Chart */}
              {coins.length > 0 && (
                <div className="bg-[rgba(15,23,42,0.95)] border border-[rgba(148,163,184,0.08)] rounded-3xl p-6 mb-6">
                  <h3 className="text-lg font-extrabold mb-1">
                    Top 50 Altcoins vs Bitcoin — Performance 30 jours
                  </h3>
                  <p className="text-[#64748b] text-xs mb-4">
                    Barres vertes = surperforme BTC | Barres rouges = sous-performe BTC
                  </p>
                  <div className="overflow-x-auto">
                    <canvas ref={canvasRef} />
                  </div>
                </div>
              )}
            </>
          )}

          {/* Explanation */}
          <div className="bg-[rgba(15,23,42,0.95)] border border-[rgba(148,163,184,0.08)] rounded-3xl p-8">
            <h3 className="text-lg font-extrabold mb-6 flex items-center gap-2">
              <span>📖</span> Comment ça marche ?
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div className="bg-gradient-to-br from-[rgba(15,23,42,0.85)] to-[rgba(30,41,59,0.5)] border border-[rgba(148,163,184,0.08)] rounded-2xl p-6">
                <h4 className="text-[15px] font-extrabold mb-3 text-[#f7931a]">🟠 Bitcoin Season (0-25)</h4>
                <p className="text-[#94a3b8] text-sm leading-relaxed">
                  Moins de 25% des top 50 altcoins surperforment BTC. Les investisseurs se réfugient dans Bitcoin.
                </p>
              </div>
              <div className="bg-gradient-to-br from-[rgba(15,23,42,0.85)] to-[rgba(30,41,59,0.5)] border border-[rgba(148,163,184,0.08)] rounded-2xl p-6">
                <h4 className="text-[15px] font-extrabold mb-3 text-[#eab308]">⚖️ Zone Neutre (25-75)</h4>
                <p className="text-[#94a3b8] text-sm leading-relaxed">
                  Pas de tendance claire. Le marché est partagé entre BTC et altcoins.
                </p>
              </div>
              <div className="bg-gradient-to-br from-[rgba(15,23,42,0.85)] to-[rgba(30,41,59,0.5)] border border-[rgba(148,163,184,0.08)] rounded-2xl p-6">
                <h4 className="text-[15px] font-extrabold mb-3 text-[#22c55e]">🟢 Altcoin Season (75-100)</h4>
                <p className="text-[#94a3b8] text-sm leading-relaxed">
                  75%+ des top 50 altcoins surperforment BTC. C&apos;est l&apos;Altseason !
                </p>
              </div>
            </div>
            <p className="text-[#64748b] text-xs mt-5 text-center">
              Données en temps réel via CoinGecko API — Stablecoins et tokens adossés exclus du calcul
            </p>
          </div>

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