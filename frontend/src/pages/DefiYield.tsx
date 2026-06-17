import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import Sidebar from "../components/Sidebar";
import PageHeader from "@/components/PageHeader";
import Footer from "@/components/Footer";

interface Pool {
  chain: string;
  project: string;
  symbol: string;
  tvlUsd: number;
  apy: number;
  apyBase: number;
  apyReward: number;
  stablecoin: boolean;
}

interface ChainTvl {
  name: string;
  tvl: number;
  change24h: number;
  change7d: number;
}

export default function DefiYield() {
  const { t } = useTranslation();
  const [pools, setPools] = useState<Pool[]>([]);
  const [chainsTvl, setChainsTvl] = useState<ChainTvl[]>([]);
  const [loading, setLoading] = useState(true);
  const [chainFilter, setChainFilter] = useState("All");
  const [sortBy, setSortBy] = useState<"apy" | "tvl">("apy");
  const [lastUpdate, setLastUpdate] = useState("");

  useEffect(() => {
    const fetchAll = async () => {
      try {
        // Parallel fetch: pools + chains TVL
        const [poolsRes, chainsRes] = await Promise.allSettled([
          fetch("https://yields.llama.fi/pools"),
          fetch("https://api.llama.fi/v2/chains"),
        ]);

        // Pools
        if (poolsRes.status === "fulfilled" && poolsRes.value.ok) {
          const data = await poolsRes.value.json();
          const filtered = (data.data || [])
            .filter((p: any) => p.tvlUsd > 1000000 && p.apy > 0.1 && p.apy < 500)
            .sort((a: any, b: any) => b.apy - a.apy)
            .slice(0, 100)
            .map((p: any) => ({
              chain: p.chain || "Unknown",
              project: p.project || "Unknown",
              symbol: p.symbol || "N/A",
              tvlUsd: p.tvlUsd || 0,
              apy: p.apy || 0,
              apyBase: p.apyBase || 0,
              apyReward: p.apyReward || 0,
              stablecoin: p.stablecoin || false,
            }));
          setPools(filtered);
        }

        // Chains TVL (DefiLlama free, no key)
        if (chainsRes.status === "fulfilled" && chainsRes.value.ok) {
          const chainsData = await chainsRes.value.json();
          const chains: ChainTvl[] = (Array.isArray(chainsData) ? chainsData : [])
            .filter((c: any) => c && c.tvl > 100_000_000)
            .sort((a: any, b: any) => b.tvl - a.tvl)
            .slice(0, 12)
            .map((c: any) => ({
              name: c.name || c.gecko_id || "Unknown",
              tvl: c.tvl || 0,
              change24h: c.change_1d || 0,
              change7d: c.change_7d || 0,
            }));
          setChainsTvl(chains);
        }

        setLastUpdate(new Date().toLocaleTimeString("fr-FR"));
      } catch {
        setPools([
          { chain: "Ethereum", project: "Aave V3", symbol: "USDC", tvlUsd: 2500000000, apy: 5.2, apyBase: 3.1, apyReward: 2.1, stablecoin: true },
          { chain: "Ethereum", project: "Lido", symbol: "stETH", tvlUsd: 15000000000, apy: 3.5, apyBase: 3.5, apyReward: 0, stablecoin: false },
          { chain: "Arbitrum", project: "GMX", symbol: "GLP", tvlUsd: 500000000, apy: 18.5, apyBase: 12.0, apyReward: 6.5, stablecoin: false },
          { chain: "BSC", project: "PancakeSwap", symbol: "CAKE-BNB", tvlUsd: 300000000, apy: 25.3, apyBase: 15.0, apyReward: 10.3, stablecoin: false },
          { chain: "Solana", project: "Marinade", symbol: "mSOL", tvlUsd: 800000000, apy: 6.8, apyBase: 6.8, apyReward: 0, stablecoin: false },
        ]);
        setLastUpdate(new Date().toLocaleTimeString("fr-FR"));
      }
      setLoading(false);
    };
    fetchAll();
  }, []);

  const chains = ["All", ...new Set(pools.map((p) => p.chain))];
  const filtered = pools
    .filter((p) => chainFilter === "All" || p.chain === chainFilter)
    .sort((a, b) => sortBy === "apy" ? b.apy - a.apy : b.tvlUsd - a.tvlUsd);

  const totalTvl = pools.reduce((s, p) => s + p.tvlUsd, 0);
  const avgApy = pools.length > 0 ? pools.reduce((s, p) => s + p.apy, 0) / pools.length : 0;

  return (
    <div className="flex min-h-screen bg-[#030712]">
      <Sidebar />
      <main className="flex-1 md:ml-[260px] pt-14 md:pt-0 bg-[#030712]">
      <PageHeader
          icon={<span className="text-lg">🌾</span>}
          title={t("pages.defiYield.title")}
          subtitle={t("pages.defiYield.subtitle")}
          accentColor="green"
          steps={[
            { n: "1", title: "Comparez les APY", desc: "Triez les pools par APY pour trouver les meilleurs rendements. Attention : un APY très élevé implique souvent un risque plus élevé." },
            { n: "2", title: "Évaluez le risque", desc: "Vérifiez la TVL (Total Value Locked) : plus elle est élevée, plus le protocole est établi et généralement plus sûr." },
            { n: "3", title: "Diversifiez", desc: "Ne concentrez pas tout votre capital dans un seul pool. Répartissez sur plusieurs protocoles et blockchains pour limiter les risques." },
          ]}
        />
        <div className="fixed inset-0 pointer-events-none z-0">
          <div className="absolute w-[500px] h-[500px] rounded-full bg-emerald-500/5 blur-[80px] top-[-150px] right-[-100px]" />
          <div className="absolute w-[400px] h-[400px] rounded-full bg-indigo-500/5 blur-[80px] bottom-[-150px] left-[-50px]" />
        </div>
        <div className="relative z-10 max-w-[1440px] mx-auto p-4 md:p-6">

          {/* ===== TVL by Chain (DefiLlama API — sans clé) ===== */}
          {chainsTvl.length > 0 && (
            <div className="relative bg-gradient-to-br from-white/[0.04] to-white/[0.01] border border-white/[0.08] rounded-3xl p-6 mb-6 overflow-hidden">
              <div className="absolute -top-24 left-1/3 w-72 h-72 rounded-full bg-emerald-500/15 blur-3xl pointer-events-none" />
              <div className="absolute -bottom-24 right-1/3 w-72 h-72 rounded-full bg-indigo-500/15 blur-3xl pointer-events-none" />

              <div className="relative flex items-center justify-between flex-wrap gap-3 mb-5">
                <div className="flex items-center gap-3">
                  <span className="inline-flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 text-white text-sm" style={{ boxShadow: "0 0 20px rgba(16,185,129,0.4)" }}>
                    🌐
                  </span>
                  <div>
                    <h2 className="text-base md:text-lg font-black text-white flex items-center gap-2">
                      TVL par Blockchain
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest border border-emerald-400/40 bg-emerald-400/10 text-emerald-300">
                        DefiLlama API
                      </span>
                    </h2>
                    <p className="text-[11px] text-gray-400">Top 12 chains par Total Value Locked · Data live · Sans clé API</p>
                  </div>
                </div>
                <div className="text-xs text-gray-400">
                  Total :{" "}
                  <strong className="text-emerald-300 font-mono">
                    ${(chainsTvl.reduce((s, c) => s + c.tvl, 0) / 1e9).toFixed(1)}B
                  </strong>
                </div>
              </div>

              <div className="relative space-y-2.5">
                {(() => {
                  const maxTvl = Math.max(...chainsTvl.map((c) => c.tvl));
                  return chainsTvl.map((c, i) => {
                    const pct = (c.tvl / maxTvl) * 100;
                    const color = i < 3 ? "from-emerald-400 to-teal-500" : i < 6 ? "from-indigo-400 to-violet-500" : "from-slate-400 to-slate-500";
                    const isPositive24 = c.change24h >= 0;
                    return (
                      <div
                        key={c.name}
                        data-testid={`chain-tvl-row-${i}`}
                        className="group relative flex items-center gap-3 hover:bg-white/[0.03] rounded-xl px-2 py-1.5 transition-all"
                        style={{ animation: "dy-fadeUp 0.5s ease-out both", animationDelay: `${i * 40}ms` }}
                      >
                        <span className="flex-shrink-0 w-7 text-[10px] font-black text-gray-500 font-mono text-right">
                          #{i + 1}
                        </span>
                        <span className="flex-shrink-0 w-24 md:w-28 text-xs font-bold text-white truncate" title={c.name}>
                          {c.name}
                        </span>
                        <div className="flex-1 relative h-7 rounded-lg bg-white/[0.04] overflow-hidden">
                          <div
                            className={`absolute inset-y-0 left-0 rounded-lg bg-gradient-to-r ${color} transition-all duration-700`}
                            style={{ width: `${pct}%`, boxShadow: i < 3 ? "0 0 12px rgba(16,185,129,0.4)" : undefined }}
                          />
                          <div className="absolute inset-0 flex items-center px-2.5 text-[10px] font-bold text-white drop-shadow-md">
                            ${(c.tvl / 1e9).toFixed(2)}B
                          </div>
                        </div>
                        <span
                          className={`flex-shrink-0 w-14 text-right text-[10px] font-bold font-mono ${
                            isPositive24 ? "text-emerald-400" : "text-red-400"
                          }`}
                          title="Variation 24h"
                        >
                          {isPositive24 ? "+" : ""}
                          {c.change24h.toFixed(1)}%
                        </span>
                      </div>
                    );
                  });
                })()}
              </div>
            </div>
          )}

          <style>{`
            @keyframes dy-fadeUp {
              from { opacity: 0; transform: translateX(-10px); }
              to { opacity: 1; transform: translateX(0); }
            }
          `}</style>

          {/* KPIs */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
            {[
              { label: "Pools analysés", value: pools.length.toString(), color: "text-indigo-400" },
              { label: "TVL Total", value: `$${(totalTvl / 1e9).toFixed(1)}B`, color: "text-emerald-400" },
              { label: "APY Moyen", value: `${avgApy.toFixed(1)}%`, color: "text-amber-400" },
              { label: "Dernière MAJ", value: lastUpdate || "—", color: "text-cyan-400" },
            ].map((kpi) => (
              <div key={kpi.label} className="bg-slate-900/70 border border-white/5 rounded-2xl p-5 hover:-translate-y-1 transition-all">
                <div className="text-xs text-gray-500 uppercase tracking-wider font-bold mb-2">{kpi.label}</div>
                <div className={`text-2xl font-black font-mono ${kpi.color}`}>{kpi.value}</div>
              </div>
            ))}
          </div>

          {/* Filters */}
          <div className="bg-slate-900/70 border border-white/5 rounded-3xl p-6 mb-6">
            <div className="flex flex-wrap gap-3 items-center">
              <select value={chainFilter} onChange={(e) => setChainFilter(e.target.value)} className="px-4 py-2.5 bg-slate-800/80 border border-white/10 rounded-xl text-white text-sm focus:border-emerald-500 outline-none">
                {chains.slice(0, 15).map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              <button onClick={() => setSortBy("apy")} className={`px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${sortBy === "apy" ? "bg-gradient-to-r from-emerald-500 to-indigo-500 text-white" : "bg-slate-800/50 text-gray-400 hover:text-white"}`}>
                Trier par APY
              </button>
              <button onClick={() => setSortBy("tvl")} className={`px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${sortBy === "tvl" ? "bg-gradient-to-r from-emerald-500 to-indigo-500 text-white" : "bg-slate-800/50 text-gray-400 hover:text-white"}`}>
                Trier par TVL
              </button>
              <span className="text-xs text-gray-500 ml-auto">{filtered.length} résultats</span>
            </div>
          </div>

          {/* Table */}
          <div className="bg-slate-900/70 border border-white/5 rounded-3xl p-6 overflow-x-auto">
            {loading ? (
              <div className="flex justify-center items-center py-16">
                <div className="w-10 h-10 border-3 border-emerald-500/15 border-t-emerald-400 rounded-full animate-spin" />
              </div>
            ) : (
              <table className="w-full min-w-[800px]">
                <thead>
                  <tr className="border-b border-white/10">
                    {["#", "Protocole", "Pool", "Chain", "APY", "APY Base", "APY Reward", "TVL"].map((h) => (
                      <th key={h} className="text-left text-xs text-gray-500 uppercase tracking-wider py-3 px-3">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.slice(0, 50).map((p, i) => (
                    <tr key={`${p.project}-${p.symbol}-${i}`} className="border-b border-white/5 hover:bg-indigo-500/5 transition-colors">
                      <td className="py-3 px-3 text-sm text-gray-500">{i + 1}</td>
                      <td className="py-3 px-3 text-sm font-bold text-white">{p.project}</td>
                      <td className="py-3 px-3 text-sm text-gray-300">{p.symbol} {p.stablecoin && <span className="text-xs bg-blue-500/10 text-blue-400 px-1.5 py-0.5 rounded">Stable</span>}</td>
                      <td className="py-3 px-3"><span className="text-xs bg-indigo-500/10 text-indigo-400 px-2 py-1 rounded-lg font-semibold">{p.chain}</span></td>
                      <td className={`py-3 px-3 font-mono font-bold text-sm ${p.apy > 20 ? "text-emerald-400" : p.apy > 5 ? "text-amber-400" : "text-gray-400"}`}>{p.apy.toFixed(2)}%</td>
                      <td className="py-3 px-3 font-mono text-sm text-gray-400">{p.apyBase.toFixed(2)}%</td>
                      <td className="py-3 px-3 font-mono text-sm text-gray-400">{p.apyReward.toFixed(2)}%</td>
                      <td className="py-3 px-3 font-mono text-sm text-gray-400">${(p.tvlUsd / 1e6).toFixed(1)}M</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Info */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            {[
              { icon: "⚠️", title: "Risques DeFi", desc: "Les rendements élevés comportent des risques : smart contract, impermanent loss, rug pull. DYOR.", color: "border-l-red-500" },
              { icon: "🔒", title: "Stablecoins", desc: "Les pools stablecoins offrent des rendements plus modestes mais avec moins de volatilité.", color: "border-l-blue-500" },
              { icon: "📊", title: "TVL", desc: "La Total Value Locked est un indicateur de confiance. Privilégiez les protocoles avec un TVL élevé.", color: "border-l-emerald-500" },
            ].map((info) => (
              <div key={info.title} className={`bg-slate-900/50 border border-white/5 ${info.color} border-l-4 rounded-2xl p-6`}>
                <h3 className="text-base font-bold text-white mb-2 flex items-center gap-2">{info.icon} {info.title}</h3>
                <p className="text-sm text-gray-400 leading-relaxed">{info.desc}</p>
              </div>
            ))}
          </div>
        </div>
        <Footer />
      </main>
    </div>
  );
}