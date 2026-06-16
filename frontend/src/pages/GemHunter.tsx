import { useEffect, useState, useCallback } from "react";
import Sidebar from "@/components/Sidebar";
import { Gem, RefreshCw, TrendingUp, TrendingDown, Droplets, Search, ArrowUpDown } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import Footer from "@/components/Footer";

const GEM_BG =
  "https://mgx-backend-cdn.metadl.com/generate/images/966405/2026-02-18/4b6e1138-5e13-42c7-9e5d-95ba3808c41a.png";

interface GemCoin {
  id: string;
  name: string;
  symbol: string;
  price: number;
  change24h: number;
  change7d: number;
  marketCap: number;
  volume: number;
  liquidity: number;
  score: number;
  trend: string;
  image?: string;
}

function formatNum(n: number): string {
  if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(2)}M`;
  if (n >= 1e3) return `$${(n / 1e3).toFixed(1)}K`;
  return `$${n.toFixed(2)}`;
}

function ScoreBar({ value }: { value: number }) {
  const color = value >= 70 ? "#10B981" : value >= 50 ? "#F59E0B" : value >= 30 ? "#F97316" : "#EF4444";
  return (
    <div className="flex items-center gap-2">
      <div className="h-2 w-16 bg-white/[0.06] rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${value}%`, backgroundColor: color }} />
      </div>
      <span className="text-xs font-bold" style={{ color }}>
        {value}
      </span>
    </div>
  );
}

export default function GemHunter() {
  const [gems, setGems] = useState<GemCoin[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"score" | "change24h" | "volume" | "marketCap">("score");

  const fetchGems = useCallback(async () => {
    setLoading(true);
    try {
      const { fetchTop200 } = await import("@/lib/cryptoApi");
      const allData = await fetchTop200(false);

      if (allData.length > 0) {
        const data = allData as any[];
        const filtered = data
          .filter((c: any) => {
            const mc = (c.market_cap as number) || 0;
            const vol = (c.total_volume as number) || 0;
            return mc >= 10_000_000 && mc <= 5_000_000_000 && vol >= 500_000;
          })
          .map((c) => {
            const mc = (c.market_cap as number) || 0;
            const vol = (c.total_volume as number) || 0;
            const ch24 = (c.price_change_percentage_24h as number) || 0;
            const ch7d = (c.price_change_percentage_7d_in_currency as number) || 0;

            const volRatio = mc > 0 ? Math.min(vol / mc, 2) : 0;
            const momentum = (ch24 * 0.6 + ch7d * 0.4) / 100;
            const rawScore = volRatio * 50 + momentum * 30 + 20;
            const score = Math.round(Math.max(0, Math.min(100, rawScore * Math.min(mc / 10_000_000, 10) / 10)));

            const trend = ch24 > 2 ? "🟢 Haussier" : ch24 < -2 ? "🔴 Baissier" : "🟡 Neutre";
            const liquidity = mc > 0 ? Math.round((vol / mc) * 100 * 100) / 100 : 0;

            return {
              id: c.id as string,
              name: c.name as string,
              symbol: ((c.symbol as string) || "").toUpperCase(),
              price: c.current_price as number,
              change24h: ch24,
              change7d: ch7d,
              marketCap: mc,
              volume: vol,
              liquidity,
              score,
              trend,
              image: c.image as string,
            };
          })
          .sort((a, b) => b.score - a.score)
          .slice(0, 30);

        setGems(filtered);
      }
      setLastUpdate(new Date().toLocaleTimeString("fr-FR"));
    } catch {
      setLastUpdate(new Date().toLocaleTimeString("fr-FR"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGems();
    const interval = setInterval(fetchGems, 60000);
    return () => clearInterval(interval);
  }, [fetchGems]);

  const displayGems = gems
    .filter(
      (g) =>
        !searchQuery ||
        g.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        g.symbol.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      if (sortBy === "score") return b.score - a.score;
      if (sortBy === "change24h") return b.change24h - a.change24h;
      if (sortBy === "volume") return b.volume - a.volume;
      return b.marketCap - a.marketCap;
    });

  const avgScore = gems.length ? Math.round(gems.reduce((s, g) => s + g.score, 0) / gems.length) : 0;
  const bestScore = gems.length ? Math.max(...gems.map((g) => g.score)) : 0;

  return (
    <div className="min-h-screen bg-[#0A0E1A] text-white">
      <Sidebar />
      <main className="md:ml-[260px] pt-14 md:pt-0 bg-[#0A0E1A]">
      <PageHeader
          icon={<Gem className="w-6 h-6" />}
          title="Crypto Pépites — Gem Hunter"
          subtitle="Découvrez les cryptos à fort potentiel avant qu’elles n’explosent. Notre algorithme IA analyse des centaines de tokens pour identifier les gemmes sous-évaluées du marché."
          accentColor="amber"
          steps={[
            { n: "1", title: "Parcourez les pépites", desc: "Chaque token affiché a été sélectionné par l'IA pour son potentiel. Consultez le score de gemme et les métriques clés." },
            { n: "2", title: "Filtrez et triez", desc: "Triez par score de gemme, variation 24h ou volume pour trouver les opportunités les plus prometteuses du moment." },
            { n: "3", title: "Faites votre DYOR", desc: "Cliquez sur un token pour voir l'analyse complète. Vérifiez toujours la liquidité et le projet avant d'investir." },
          ]}
        />
        {/* ===== HERO (premium CSS) ===== */}
        <div className="relative rounded-3xl overflow-hidden mb-6 border border-white/[0.08]">
          <div className="absolute inset-0 bg-[#0A0E1A]" />
          <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-purple-500/22 blur-3xl" style={{ animation: "gh-pulse 6s ease-in-out infinite" }} />
          <div className="absolute -bottom-24 right-1/3 w-80 h-80 rounded-full bg-amber-500/22 blur-3xl" style={{ animation: "gh-pulse 8s ease-in-out infinite reverse" }} />
          <div className="absolute inset-0 opacity-[0.04]" style={{
            backgroundImage: "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
            backgroundSize: "44px 44px",
          }} />
          <div className="relative z-10 flex items-center justify-between gap-4 px-6 md:px-10 py-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-purple-500/15 border border-purple-500/40 flex items-center justify-center" style={{ boxShadow: "0 0 30px rgba(168,85,247,0.3)" }}>
                <Gem className="w-7 h-7 text-purple-300" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <h1 className="text-xl md:text-2xl font-black bg-gradient-to-r from-purple-400 via-pink-400 to-amber-400 bg-clip-text text-transparent">
                    Crypto Pépites
                  </h1>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border border-amber-500/40 bg-amber-500/10 text-amber-300">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" /> Gem Hunter
                  </span>
                </div>
                <p className="text-xs md:text-sm text-gray-400">Découvrez les tokens à fort potentiel · Market Cap 10M–5B · {gems.length} pépites</p>
              </div>
            </div>
            <button onClick={fetchGems} disabled={loading}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.1] text-sm font-semibold transition-all disabled:opacity-50">
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
              <span className="hidden sm:inline">{lastUpdate ? `MAJ ${lastUpdate}` : "Rafraîchir"}</span>
            </button>
          </div>
        </div>

        <style>{`
          @keyframes gh-pulse {
            0%, 100% { transform: scale(1) translate(0,0); opacity: 0.3; }
            50% { transform: scale(1.2) translate(20px,-10px); opacity: 0.45; }
          }
          @keyframes gh-fadeUp {
            from { opacity: 0; transform: translateY(12px); }
            to { opacity: 1; transform: translateY(0); }
          }
          .gh-anim { animation: gh-fadeUp 0.6s ease-out both; }
        `}</style>

        {/* KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4 mb-6">
          {[
            { label: "Pépites Détectées", value: gems.length, color: "#cbd5e1", sub: "Filtre: MC 10M–5B, Vol > 500K" },
            { label: "Score Moyen", value: avgScore, color: "#fbbf24", sub: "Sur 100" },
            { label: "Top Gem", value: gems[0]?.symbol || "—", color: "#a78bfa", sub: gems[0]?.name || "" },
          ].map((k, i) => (
            <div key={i}
              className="gh-anim relative bg-gradient-to-br from-white/[0.04] to-white/[0.01] border border-white/[0.06] hover:border-white/[0.14] rounded-2xl p-4 transition-all overflow-hidden"
              style={{ animationDelay: `${i * 80}ms` }}
            >
              <div className="absolute -top-12 -right-12 w-32 h-32 rounded-full blur-3xl opacity-25" style={{ background: k.color }} />
              <div className="relative">
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-1">{k.label}</p>
                <p className="text-2xl font-black" style={{ color: k.color, textShadow: `0 0 14px ${k.color}44` }}>{k.value}</p>
                <p className="text-[10px] text-gray-600 mt-1">{k.sub}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="hidden">
          <div className="bg-[#111827] border border-white/[0.06] rounded-2xl p-4">
            <p className="text-xs text-gray-500 font-semibold mb-1">Pépites Détectées</p>
            <p className="text-2xl font-extrabold">{gems.length}</p>
            <p className="text-[10px] text-gray-600 mt-1">Filtre: MC 10M–5B, Vol &gt; 500K</p>
          </div>
          <div className="bg-[#111827] border border-white/[0.06] rounded-2xl p-4">
            <p className="text-xs text-gray-500 font-semibold mb-1">Score Moyen</p>
            <p className="text-2xl font-extrabold text-amber-400">{avgScore}</p>
          </div>
          <div className="bg-[#111827] border border-white/[0.06] rounded-2xl p-4">
            <p className="text-xs text-gray-500 font-semibold mb-1">Meilleur Score</p>
            <p className="text-2xl font-extrabold text-emerald-400">{bestScore}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-[#111827] border border-white/[0.06] rounded-2xl p-4 mb-6">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex-1 min-w-[200px] relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Rechercher..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-black/30 border border-white/[0.08] text-sm text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500/50"
              />
            </div>
            <div className="flex items-center gap-2">
              <ArrowUpDown className="w-4 h-4 text-gray-500" />
              <span className="text-xs text-gray-500">Trier par:</span>
              {(
                [
                  { key: "score", label: "Score" },
                  { key: "change24h", label: "24h %" },
                  { key: "volume", label: "Volume" },
                  { key: "marketCap", label: "Market Cap" },
                ] as const
              ).map((s) => (
                <button
                  key={s.key}
                  onClick={() => setSortBy(s.key)}
                  className={`px-3 py-2 rounded-lg text-xs font-bold transition-all ${
                    sortBy === s.key
                      ? "bg-purple-500/20 text-purple-400 border border-purple-500/30"
                      : "bg-white/[0.04] text-gray-400 border border-white/[0.06] hover:bg-white/[0.08]"
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-[#111827] border border-white/[0.06] rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px]">
              <thead>
                <tr className="border-b border-white/[0.06]">
                  <th className="text-left py-3 px-4 text-xs font-bold text-gray-500 uppercase">Token</th>
                  <th className="text-right py-3 px-4 text-xs font-bold text-gray-500 uppercase">Prix</th>
                  <th className="text-right py-3 px-4 text-xs font-bold text-gray-500 uppercase">24h</th>
                  <th className="text-right py-3 px-4 text-xs font-bold text-gray-500 uppercase">7j</th>
                  <th className="text-right py-3 px-4 text-xs font-bold text-gray-500 uppercase">Market Cap</th>
                  <th className="text-right py-3 px-4 text-xs font-bold text-gray-500 uppercase">Volume</th>
                  <th className="text-right py-3 px-4 text-xs font-bold text-gray-500 uppercase">Vol/MC</th>
                  <th className="text-center py-3 px-4 text-xs font-bold text-gray-500 uppercase">Score</th>
                  <th className="text-left py-3 px-4 text-xs font-bold text-gray-500 uppercase">Tendance</th>
                </tr>
              </thead>
              <tbody>
                {displayGems.map((g) => (
                  <tr key={g.id} className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        {g.image ? (
                          <img src={g.image} alt={g.symbol} className="w-7 h-7 rounded-full" />
                        ) : (
                          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center text-[10px] font-bold">
                            {g.symbol.slice(0, 2)}
                          </div>
                        )}
                        <div>
                          <p className="text-sm font-bold">{g.symbol}</p>
                          <p className="text-[10px] text-gray-500">{g.name}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right text-sm font-bold">
                      ${g.price >= 1 ? g.price.toFixed(2) : g.price.toFixed(6)}
                    </td>
                    <td className={`py-3 px-4 text-right text-sm font-bold ${g.change24h >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                      <div className="flex items-center justify-end gap-1">
                        {g.change24h >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                        {g.change24h >= 0 ? "+" : ""}
                        {g.change24h.toFixed(1)}%
                      </div>
                    </td>
                    <td className={`py-3 px-4 text-right text-sm font-bold ${g.change7d >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                      {g.change7d >= 0 ? "+" : ""}
                      {g.change7d.toFixed(1)}%
                    </td>
                    <td className="py-3 px-4 text-right text-sm text-gray-300">{formatNum(g.marketCap)}</td>
                    <td className="py-3 px-4 text-right text-sm text-gray-300">{formatNum(g.volume)}</td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Droplets className="w-3 h-3 text-cyan-400" />
                        <span className="text-xs font-bold text-cyan-400">{g.liquidity.toFixed(1)}%</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <ScoreBar value={g.score} />
                    </td>
                    <td className="py-3 px-4 text-sm">{g.trend}</td>
                  </tr>
                ))}
                {displayGems.length === 0 && (
                  <tr>
                    <td colSpan={9} className="py-10 text-center text-gray-500">
                      {loading ? "Chargement des données..." : "Aucune pépite trouvée pour ces critères"}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
        <Footer />
      </main>
    </div>
  );
}
