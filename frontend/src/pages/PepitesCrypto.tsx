import { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import PageHeader from "@/components/PageHeader";
import Footer from "@/components/Footer";

interface Pepite {
  symbol: string;
  name: string;
  price: number;
  change24h: number;
  mcap: number;
  volume: number;
  score: number;
  category: string;
  potential: string;
  risk: "Low" | "Medium" | "High";
  reason: string;
}

/**
 * Determine category based on the coin's market cap rank and name/symbol patterns.
 * This is a best-effort classification from CoinGecko data.
 */
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

/**
 * Estimate growth potential based on market cap tier
 */
function estimatePotential(mcap: number): string {
  if (mcap < 50e6) return "x10-x50";
  if (mcap < 200e6) return "x5-x20";
  if (mcap < 500e6) return "x3-x10";
  if (mcap < 1e9) return "x2-x5";
  return "x2-x3";
}

/**
 * Generate a reason based on REAL metrics
 */
function generateReason(volMcapRatio: number, change24h: number, mcap: number): string {
  const parts: string[] = [];
  if (volMcapRatio > 0.3) parts.push(`Volume/MCap très élevé (${(volMcapRatio * 100).toFixed(1)}%)`);
  else if (volMcapRatio > 0.15) parts.push(`Volume/MCap élevé (${(volMcapRatio * 100).toFixed(1)}%)`);
  if (change24h > 5) parts.push(`Momentum haussier (+${change24h.toFixed(1)}%)`);
  else if (change24h < -5) parts.push(`Correction récente (${change24h.toFixed(1)}%) — potentiel rebond`);
  if (mcap < 100e6) parts.push("Micro-cap à fort potentiel");
  else if (mcap < 500e6) parts.push("Small-cap sous-évaluée");
  if (parts.length === 0) parts.push(`MCap: $${(mcap / 1e6).toFixed(0)}M, Vol/MCap: ${(volMcapRatio * 100).toFixed(1)}%`);
  return parts.join(" — ");
}

export default function PepitesCrypto() {
  const [pepites, setPepites] = useState<Pepite[]>([]);
  const [loading, setLoading] = useState(true);
  const [riskFilter, setRiskFilter] = useState("ALL");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { fetchTop200 } = await import("@/lib/cryptoApi");
        const data = await fetchTop200(false) as any[];
        const smallCaps = data
          .filter((c: any) => c.market_cap && c.market_cap < 5e9 && c.market_cap > 10e6)
          .map((c: any) => {
            const mcap = c.market_cap || 0;
            const vol = c.total_volume || 0;
            const change = c.price_change_percentage_24h || 0;
            const volMcapRatio = vol / mcap;

            // Deterministic score based on real metrics
            let score = 40;
            if (volMcapRatio > 0.3) score += 20;
            else if (volMcapRatio > 0.15) score += 12;
            else if (volMcapRatio > 0.08) score += 5;
            if (change > 5) score += 12;
            else if (change > 2) score += 6;
            if (mcap < 100e6) score += 12;
            else if (mcap < 500e6) score += 8;
            else if (mcap < 1e9) score += 4;
            // Bonus for very high volume activity
            if (vol > 100e6 && mcap < 500e6) score += 8;
            score = Math.min(score, 98);

            let risk: Pepite["risk"];
            if (mcap > 1e9) risk = "Low";
            else if (mcap > 200e6) risk = "Medium";
            else risk = "High";

            return {
              symbol: c.symbol?.toUpperCase() || "N/A",
              name: c.name || "Unknown",
              price: c.current_price || 0,
              change24h: change,
              mcap,
              volume: vol,
              score,
              category: classifyCategory(c.name || "", c.symbol || "", mcap),
              potential: estimatePotential(mcap),
              risk,
              reason: generateReason(volMcapRatio, change, mcap),
            };
          })
          .sort((a: Pepite, b: Pepite) => b.score - a.score)
          .slice(0, 30);
        setPepites(smallCaps);
      } catch {
        setPepites([]);
      }
      setLoading(false);
    };
    fetchData();
  }, []);

  const filtered = riskFilter === "ALL" ? pepites : pepites.filter((p) => p.risk === riskFilter);

  return (
    <div className="flex min-h-screen bg-[#030712]">
      <Sidebar />
      <main className="flex-1 md:ml-[260px] pt-14 md:pt-0 bg-[#030712]">
      <PageHeader
          icon={<span className="text-lg">💎</span>}
          title="Pépites Crypto"
          subtitle="Découvrez les gemmes cachées du marché crypto : projets sous-évalués avec un fort potentiel de croissance, sélectionnés et scorés par notre algorithme IA."
          accentColor="amber"
          steps={[
            { n: "1", title: "Explorez les pépites", desc: "Chaque carte représente un projet avec un score de potentiel, un niveau de risque et les raisons pour lesquelles l'IA le considère comme une pépite." },
            { n: "2", title: "Filtrez par risque", desc: "Sélectionnez votre tolérance au risque : Faible (projets établis), Moyen (croissance), Élevé (early stage à fort potentiel)." },
            { n: "3", title: "Faites votre DYOR", desc: "Ces sélections sont des pistes de recherche, pas des conseils financiers. Faites toujours votre propre recherche avant d'investir." },
          ]}
        />
        <div className="fixed inset-0 pointer-events-none z-0">
          <div className="absolute w-[600px] h-[600px] rounded-full bg-amber-500/5 blur-[80px] top-[-200px] left-[-100px]" />
          <div className="absolute w-[500px] h-[500px] rounded-full bg-emerald-500/5 blur-[80px] bottom-[-200px] right-[-100px]" />
        </div>
        <div className="relative z-10 max-w-[1440px] mx-auto">
          <div className="text-center mb-10 pt-8">
            <h1 className="text-5xl font-black bg-gradient-to-r from-amber-400 via-emerald-400 to-amber-400 bg-[length:300%_auto] bg-clip-text text-transparent animate-gradient">
              💎 Pépites Crypto
            </h1>
            <p className="text-gray-500 mt-3 text-lg">Découvrez les gems à fort potentiel avant le marché</p>
            <div className="inline-flex items-center gap-2 mt-4 bg-amber-500/10 border border-amber-500/25 rounded-full px-5 py-1.5 text-xs text-amber-400 font-bold uppercase tracking-widest">
              <span className="w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_8px_#f59e0b] animate-pulse" />
              Données CoinGecko — Scores déterministes
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-2 mb-6 justify-center">
            {["ALL", "Low", "Medium", "High"].map((r) => (
              <button key={r} onClick={() => setRiskFilter(r)} className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${riskFilter === r ? "bg-amber-500/20 text-amber-400 border border-amber-500/30" : "bg-slate-800/50 text-gray-500 hover:text-white border border-white/5"}`}>
                {r === "ALL" ? "Tous" : `Risque ${r}`}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="flex justify-center py-16">
              <div className="w-11 h-11 border-3 border-amber-500/15 border-t-amber-400 rounded-full animate-spin" />
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map((p, i) => (
                <div key={p.symbol} className="bg-slate-900/70 border border-white/5 rounded-2xl p-6 hover:border-amber-500/20 transition-all hover:-translate-y-1 relative overflow-hidden">
                  {i < 3 && <div className="absolute top-3 right-3 text-2xl opacity-20">{i === 0 ? "🥇" : i === 1 ? "🥈" : "🥉"}</div>}
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <span className="text-lg font-bold text-white">{p.symbol}</span>
                      <span className="text-xs text-gray-500 ml-2">{p.name}</span>
                    </div>
                    <span className={`text-xs font-bold px-2 py-1 rounded-lg ${p.risk === "Low" ? "bg-emerald-500/10 text-emerald-400" : p.risk === "Medium" ? "bg-amber-500/10 text-amber-400" : "bg-red-500/10 text-red-400"}`}>
                      {p.risk} Risk
                    </span>
                  </div>

                  <div className="flex items-baseline gap-3 mb-3">
                    <span className="text-xl font-black font-mono text-white">${p.price < 1 ? p.price.toFixed(4) : p.price.toLocaleString()}</span>
                    <span className={`text-sm font-bold ${p.change24h >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                      {p.change24h >= 0 ? "+" : ""}{p.change24h.toFixed(2)}%
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
                      <span className="text-gray-500">Catégorie</span>
                      <span className="float-right font-bold text-indigo-400">{p.category}</span>
                    </div>
                    <div className="bg-white/[0.03] rounded-lg p-2">
                      <span className="text-gray-500">Potentiel</span>
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
          <div className="mt-6 bg-red-500/5 border border-red-500/15 rounded-2xl p-6 text-center">
            <p className="text-sm text-red-400/80">
              ⚠️ <strong>Avertissement :</strong> Les pépites crypto sont des investissements à haut risque. Scores calculés à partir des données CoinGecko réelles (Volume/MCap, variation 24h, capitalisation). Ne jamais investir plus que ce que vous pouvez vous permettre de perdre. DYOR.
            </p>
          </div>
        </div>
        <Footer />
      </main>
    </div>
  );
}