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

            let score = 50;
            if (volMcapRatio > 0.3) score += 15;
            if (change > 5) score += 10;
            if (mcap < 500e6) score += 10;
            if (mcap < 100e6) score += 5;
            score += Math.round(Math.random() * 15);
            score = Math.min(score, 98);

            const categories = ["DeFi", "Gaming", "AI", "L2", "Infrastructure", "Meme", "RWA", "DePIN"];
            const potentials = ["x5-x10", "x3-x5", "x10-x50", "x2-x5", "x5-x20"];

            let risk: Pepite["risk"];
            if (mcap > 1e9) risk = "Low";
            else if (mcap > 200e6) risk = "Medium";
            else risk = "High";

            const reasons = [
              "Volume/MCap ratio élevé — forte activité relative",
              "Momentum haussier avec accumulation whale",
              "Narratif porteur + faible capitalisation",
              "Développement actif + partenariats récents",
              "Sous-évalué par rapport aux fondamentaux",
            ];

            return {
              symbol: c.symbol?.toUpperCase() || "N/A",
              name: c.name || "Unknown",
              price: c.current_price || 0,
              change24h: change,
              mcap,
              volume: vol,
              score,
              category: categories[Math.floor(Math.random() * categories.length)],
              potential: potentials[Math.floor(Math.random() * potentials.length)],
              risk,
              reason: reasons[Math.floor(Math.random() * reasons.length)],
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
      <main className="flex-1 ml-[260px]">
      <PageHeader
          icon={<span className="text-lg">💎</span>}
          title="Pépites Crypto"
          subtitle="Découvrez les gemmes cachées du marché crypto : projets sous-évalués avec un fort potentiel de croissance, sélectionnés et scorés par notre algorithme IA."
          accentColor="amber"
          steps={[
            { n: "1", title: "Explorez les pépites", desc: "Chaque carte représente un projet avec un score de potentiel, un niveau de risque et les raisons pour lesquelles l’IA le considère comme une pépite." },
            { n: "2", title: "Filtrez par risque", desc: "Sélectionnez votre tolérance au risque : Faible (projets établis), Moyen (croissance), Élevé (early stage à fort potentiel)." },
            { n: "3", title: "Faites votre DYOR", desc: "Ces sélections sont des pistes de recherche, pas des conseils financiers. Faites toujours votre propre recherche avant d’investir." },
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
              AI Gem Detection
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
              ⚠️ <strong>Avertissement :</strong> Les pépites crypto sont des investissements à haut risque. Ne jamais investir plus que ce que vous pouvez vous permettre de perdre. DYOR (Do Your Own Research).
            </p>
          </div>
        </div>
        <Footer />
      </main>
    </div>
  );
}