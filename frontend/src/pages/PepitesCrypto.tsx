import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import Sidebar from "../components/Sidebar";
import PageHeader from "@/components/PageHeader";
import Footer from "@/components/Footer";
import { Search, RefreshCw, ArrowUpDown } from "lucide-react";

interface Pepite {
  symbol: string;
  name: string;
  image?: string;
  price: number;
  change24h: number;
  change7d: number;
  mcap: number;
  volume: number;
  liquidity: number;
  score: number;
  category: string;
  potential: string;
  risk: "Low" | "Medium" | "High";
  reason: string;
}

type SortKey = "score" | "change24h" | "change7d" | "volume" | "mcap";

const EXCLUDED_IDS = new Set([
  "tether", "usd-coin", "dai", "binance-usd", "true-usd", "paxos-standard",
  "usdd", "frax", "gemini-dollar", "paypal-usd", "first-digital-usd",
  "ethena-usde", "usual-usd", "usds", "usd1", "ripple-usd", "global-dollar",
  "falcon-usd", "gho", "usdai", "wrapped-bitcoin", "staked-ether",
  "wrapped-steth", "coinbase-wrapped-staked-eth", "binance-staked-sol",
  "wrapped-eeth", "mantle-staked-ether", "usdt0", "susds", "syrupusdc",
  "blackrock-usd-institutional-digital-liquidity-fund", "ondo-us-dollar-yield",
]);

function classifyCategory(name: string, symbol: string, mcap: number): string {
  const n = (name + " " + symbol).toLowerCase();
  if (n.includes("doge") || n.includes("shib") || n.includes("pepe") || n.includes("floki") || n.includes("bonk") || n.includes("wif") || n.includes("meme")) return "Meme";
  if (n.includes("matic") || n.includes("arb") || n.includes("op") || n.includes("zk") || n.includes("base") || n.includes("mantle") || n.includes("scroll")) return "L2";
  if (n.includes("render") || n.includes("fetch") || n.includes("ocean") || n.includes("agix") || n.includes("ai") || n.includes("bittensor")) return "AI";
  if (n.includes("sand") || n.includes("mana") || n.includes("axs") || n.includes("gala") || n.includes("imx") || n.includes("game")) return "Gaming";
  if (n.includes("aave") || n.includes("uni") || n.includes("crv") || n.includes("mkr") || n.includes("comp") || n.includes("sushi") || n.includes("ldo") || n.includes("defi")) return "DeFi";
  if (n.includes("fil") || n.includes("ar") || n.includes("theta") || n.includes("hnt") || n.includes("rndr") || n.includes("depin")) return "DePIN";
  if (n.includes("ondo") || n.includes("rwa") || n.includes("real")) return "RWA";
  if (mcap < 200e6) return "Micro-Cap";
  return "Infrastructure";
}

function estimatePotential(mcap: number): string {
  if (mcap < 50e6) return "x10-x50";
  if (mcap < 200e6) return "x5-x20";
  if (mcap < 500e6) return "x3-x10";
  if (mcap < 1e9) return "x2-x5";
  return "x2-x3";
}

function generateReason(volMcapRatio: number, change24h: number, change7d: number, mcap: number): string {
  const parts: string[] = [];
  if (volMcapRatio > 0.3) parts.push(`Volume/MCap très élevé (${(volMcapRatio * 100).toFixed(1)}%)`);
  else if (volMcapRatio > 0.15) parts.push(`Volume/MCap élevé (${(volMcapRatio * 100).toFixed(1)}%)`);
  if (change24h > 5) parts.push(`Momentum haussier (+${change24h.toFixed(1)}%)`);
  else if (change24h < -5) parts.push(`Correction récente (${change24h.toFixed(1)}%) — potentiel rebond`);
  if (change7d > 15) parts.push(`Fort momentum 7j (+${change7d.toFixed(0)}%)`);
  if (mcap < 100e6) parts.push("Micro-cap à fort potentiel");
  else if (mcap < 500e6) parts.push("Small-cap sous-évaluée");
  if (parts.length === 0) parts.push(`MCap: $${(mcap / 1e6).toFixed(0)}M, Vol/MCap: ${(volMcapRatio * 100).toFixed(1)}%`);
  return parts.join(" — ");
}

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: "score", label: "Score IA" },
  { key: "change24h", label: "24h %" },
  { key: "change7d", label: "7j %" },
  { key: "volume", label: "Volume" },
  { key: "mcap", label: "MCap" },
];

export default function PepitesCrypto() {
  const { t } = useTranslation();
  const [pepites, setPepites] = useState<Pepite[]>([]);
  const [loading, setLoading] = useState(true);
  const [riskFilter, setRiskFilter] = useState("ALL");
  const [catFilter, setCatFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortKey>("score");
  const [lastUpdate, setLastUpdate] = useState("");

  const fetchData = useCallback(async () => {
    try {
      const { fetchTop200 } = await import("@/lib/cryptoApi");
      const data = await fetchTop200(false) as any[];
      const smallCaps = data
        .filter((c: any) => c.market_cap && c.market_cap < 5e9 && c.market_cap > 10e6 && (c.total_volume || 0) >= 500_000)
        .filter((c: any) => !EXCLUDED_IDS.has(c.id) && !/usd|stable|wrapped|staked/i.test(c.name || ""))
        .map((c: any) => {
          const mcap = c.market_cap || 0;
          const vol = c.total_volume || 0;
          const change = c.price_change_percentage_24h || 0;
          const change7d = c.price_change_percentage_7d_in_currency || 0;
          const volMcapRatio = vol / mcap;

          let score = 40;
          if (volMcapRatio > 0.3) score += 20;
          else if (volMcapRatio > 0.15) score += 12;
          else if (volMcapRatio > 0.08) score += 5;
          if (change > 5) score += 12;
          else if (change > 2) score += 6;
          if (change7d > 15) score += 6;
          else if (change7d > 5) score += 3;
          if (mcap < 100e6) score += 12;
          else if (mcap < 500e6) score += 8;
          else if (mcap < 1e9) score += 4;
          if (vol > 100e6 && mcap < 500e6) score += 8;
          score = Math.min(score, 98);

          let risk: Pepite["risk"];
          if (mcap > 1e9) risk = "Low";
          else if (mcap > 200e6) risk = "Medium";
          else risk = "High";

          return {
            symbol: c.symbol?.toUpperCase() || "N/A",
            name: c.name || "Unknown",
            image: c.image as string | undefined,
            price: c.current_price || 0,
            change24h: change,
            change7d,
            mcap,
            volume: vol,
            liquidity: Math.round(volMcapRatio * 100 * 10) / 10,
            score,
            category: classifyCategory(c.name || "", c.symbol || "", mcap),
            potential: estimatePotential(mcap),
            risk,
            reason: generateReason(volMcapRatio, change, change7d, mcap),
          };
        })
        .sort((a: Pepite, b: Pepite) => b.score - a.score)
        .slice(0, 40);
      setPepites(smallCaps);
      setLastUpdate(new Date().toLocaleTimeString("fr-CA"));
    } catch {
      setPepites([]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
    const iv = setInterval(fetchData, 60000);
    return () => clearInterval(iv);
  }, [fetchData]);

  const categories = ["ALL", ...Array.from(new Set(pepites.map((p) => p.category))).sort()];

  const filtered = pepites
    .filter((p) => riskFilter === "ALL" || p.risk === riskFilter)
    .filter((p) => catFilter === "ALL" || p.category === catFilter)
    .filter((p) => !searchQuery || p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.symbol.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => (sortBy === "mcap" ? b.mcap - a.mcap : b[sortBy] - a[sortBy]));

  return (
    <div className="flex min-h-screen bg-[#030712]">
      <Sidebar />
      <main className="flex-1 md:ml-[260px] pt-14 md:pt-0 bg-[#030712]">
      <PageHeader
          icon={<span className="text-lg">💎</span>}
          title={t("pages.pepitesCrypto.title")}
          subtitle={t("pages.pepitesCrypto.subtitle")}
          accentColor="amber"
          steps={[
            { n: "1", title: t("pages.pepitesCrypto.steps.1.title"), desc: t("pages.pepitesCrypto.steps.1.desc") },
            { n: "2", title: t("pages.pepitesCrypto.steps.2.title"), desc: t("pages.pepitesCrypto.steps.2.desc") },
            { n: "3", title: t("pages.pepitesCrypto.steps.3.title"), desc: t("pages.pepitesCrypto.steps.3.desc") },
          ]}
        />
        <div className="fixed inset-0 pointer-events-none z-0">
          <div className="absolute w-[600px] h-[600px] rounded-full bg-amber-500/5 blur-[80px] top-[-200px] left-[-100px]" />
          <div className="absolute w-[500px] h-[500px] rounded-full bg-emerald-500/5 blur-[80px] bottom-[-200px] right-[-100px]" />
        </div>
        <div className="relative z-10 max-w-[1440px] mx-auto">
          <div className="text-center mb-8 pt-8">
            <h1 className="text-5xl font-black bg-gradient-to-r from-amber-400 via-emerald-400 to-amber-400 bg-[length:300%_auto] bg-clip-text text-transparent animate-gradient">
              💎 Pépites Crypto
            </h1>
            <p className="text-gray-500 mt-3 text-lg">Découvrez les gems à fort potentiel avant le marché</p>
            <div className="inline-flex items-center gap-3 mt-4">
              <span className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/25 rounded-full px-5 py-1.5 text-xs text-amber-400 font-bold uppercase tracking-widest">
                <span className="w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_8px_#f59e0b] animate-pulse" />
                Données CoinGecko — Scores déterministes
              </span>
              <button data-testid="pepites-refresh" onClick={() => { setLoading(true); fetchData(); }} className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-4 py-1.5 text-xs font-bold text-gray-400 hover:text-white transition-colors">
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
                {lastUpdate ? `MàJ ${lastUpdate}` : "Rafraîchir"}
              </button>
            </div>
          </div>

          {/* Recherche + tri */}
          <div className="flex flex-wrap items-center justify-center gap-3 mb-4 px-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                data-testid="pepites-search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Rechercher une crypto…"
                className="pl-9 pr-4 py-2 rounded-xl bg-slate-800/60 border border-white/10 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-amber-500/40 w-56"
              />
            </div>
            <div className="flex items-center gap-1.5">
              <ArrowUpDown className="w-3.5 h-3.5 text-gray-500" />
              {SORT_OPTIONS.map((o) => (
                <button key={o.key} data-testid={`pepites-sort-${o.key}`} onClick={() => setSortBy(o.key)} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${sortBy === o.key ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" : "bg-slate-800/50 text-gray-500 hover:text-white border border-white/5"}`}>
                  {o.label}
                </button>
              ))}
            </div>
          </div>

          {/* Filtres risque + catégorie */}
          <div className="flex flex-wrap gap-2 mb-2 justify-center px-4">
            {["ALL", "Low", "Medium", "High"].map((r) => (
              <button key={r} data-testid={`pepites-risk-${r.toLowerCase()}`} onClick={() => setRiskFilter(r)} className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${riskFilter === r ? "bg-amber-500/20 text-amber-400 border border-amber-500/30" : "bg-slate-800/50 text-gray-500 hover:text-white border border-white/5"}`}>
                {r === "ALL" ? "Tous" : `Risque ${r}`}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-1.5 mb-6 justify-center px-4">
            {categories.map((c) => (
              <button key={c} data-testid={`pepites-cat-${c.toLowerCase()}`} onClick={() => setCatFilter(c)} className={`px-3 py-1 rounded-full text-[11px] font-bold transition-all ${catFilter === c ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30" : "bg-slate-800/40 text-gray-500 hover:text-white border border-white/5"}`}>
                {c === "ALL" ? "Toutes catégories" : c}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="flex justify-center py-16">
              <div className="w-11 h-11 border-3 border-amber-500/15 border-t-amber-400 rounded-full animate-spin" />
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 px-4">
              {filtered.length === 0 && (
                <p data-testid="pepites-empty" className="col-span-full text-center text-gray-500 py-10 text-sm">Aucune pépite ne correspond à ces filtres.</p>
              )}
              {filtered.map((p, i) => (
                <div key={p.symbol} data-testid={`pepite-card-${p.symbol.toLowerCase()}`} className="bg-slate-900/70 border border-white/5 rounded-2xl p-6 hover:border-amber-500/20 transition-all hover:-translate-y-1 relative overflow-hidden">
                  {sortBy === "score" && i < 3 && <div className="absolute top-3 right-3 text-2xl opacity-20">{i === 0 ? "🥇" : i === 1 ? "🥈" : "🥉"}</div>}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2.5">
                      {p.image && <img src={p.image} alt={p.symbol} className="w-8 h-8 rounded-full" loading="lazy" />}
                      <div>
                        <span className="text-lg font-bold text-white">{p.symbol}</span>
                        <span className="text-xs text-gray-500 ml-2">{p.name}</span>
                      </div>
                    </div>
                    <span className={`text-xs font-bold px-2 py-1 rounded-lg ${p.risk === "Low" ? "bg-emerald-500/10 text-emerald-400" : p.risk === "Medium" ? "bg-amber-500/10 text-amber-400" : "bg-red-500/10 text-red-400"}`}>
                      {p.risk} Risk
                    </span>
                  </div>

                  <div className="flex items-baseline gap-3 mb-3">
                    <span className="text-xl font-black font-mono text-white">${p.price < 1 ? p.price.toFixed(4) : p.price.toLocaleString()}</span>
                    <span className={`text-sm font-bold ${p.change24h >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                      {p.change24h >= 0 ? "+" : ""}{p.change24h.toFixed(2)}% 24h
                    </span>
                    <span className={`text-xs font-bold ${p.change7d >= 0 ? "text-emerald-400/70" : "text-red-400/70"}`}>
                      {p.change7d >= 0 ? "+" : ""}{p.change7d.toFixed(1)}% 7j
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 mb-3 text-xs">
                    <div className="bg-white/[0.03] rounded-lg p-2">
                      <span className="text-gray-500">MCap</span>
                      <span className="float-right font-bold text-white">${(p.mcap / 1e6).toFixed(0)}M</span>
                    </div>
                    <div className="bg-white/[0.03] rounded-lg p-2">
                      <span className="text-gray-500">Volume</span>
                      <span className="float-right font-bold text-white">${(p.volume / 1e6).toFixed(0)}M</span>
                    </div>
                    <div className="bg-white/[0.03] rounded-lg p-2">
                      <span className="text-gray-500">Liquidité</span>
                      <span className={`float-right font-bold ${p.liquidity > 15 ? "text-emerald-400" : "text-white"}`}>{p.liquidity}%</span>
                    </div>
                    <div className="bg-white/[0.03] rounded-lg p-2">
                      <span className="text-gray-500">Catégorie</span>
                      <span className="float-right font-bold text-indigo-400">{p.category}</span>
                    </div>
                    <div className="bg-white/[0.03] rounded-lg p-2 col-span-2">
                      <span className="text-gray-500">Potentiel estimé</span>
                      <span className="float-right font-bold text-amber-400">{p.potential}</span>
                    </div>
                  </div>

                  <div className="mb-3">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-gray-500">Score IA</span>
                      <span className="font-bold text-amber-400">{p.score}/100</span>
                    </div>
                    <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                      <div className="h-full rounded-full bg-gradient-to-r from-amber-500 to-emerald-400" style={{ width: `${p.score}%` }} />
                    </div>
                  </div>

                  <p className="text-xs text-gray-400 leading-relaxed">{p.reason}</p>
                </div>
              ))}
            </div>
          )}

          {/* Disclaimer */}
          <div className="mt-6 mx-4 bg-red-500/5 border border-red-500/15 rounded-2xl p-6 text-center">
            <p className="text-sm text-red-400/80">
              ⚠️ <strong>Avertissement :</strong> Les pépites crypto sont des investissements à haut risque. Scores calculés à partir des données CoinGecko réelles (Volume/MCap, variations 24h/7j, capitalisation). Ne jamais investir plus que ce que vous pouvez vous permettre de perdre. DYOR.
            </p>
          </div>
        </div>
        <Footer />
      </main>
    </div>
  );
}
