import { useState } from "react";
import Sidebar from "@/components/Sidebar";
import { Search, AlertTriangle, TrendingUp, Shield, Droplets, BarChart3, ExternalLink } from "lucide-react";
import PageHeader from "@/components/PageHeader";

interface TokenResult {
  name: string;
  symbol: string;
  price: number;
  change24h: number;
  marketCap: number;
  volume: number;
  liquidityScore: number;
  riskScore: number;
  momentum: string;
  image?: string;
}

function ScoreBar({ value, max = 100, color }: { value: number; max?: number; color: string }) {
  return (
    <div className="h-2 bg-white/[0.06] rounded-full overflow-hidden w-full">
      <div
        className="h-full rounded-full transition-all duration-700"
        style={{ width: `${(value / max) * 100}%`, backgroundColor: color }}
      />
    </div>
  );
}

function formatNum(n: number): string {
  if (n >= 1e12) return `$${(n / 1e12).toFixed(2)}T`;
  if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(2)}M`;
  if (n >= 1e3) return `$${(n / 1e3).toFixed(1)}K`;
  return `$${n.toFixed(2)}`;
}

export default function TokenScanner() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<TokenResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const searchTokens = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setSearched(true);

    try {
      const { fetchTop200 } = await import("@/lib/cryptoApi");
      const allData = await fetchTop200(false);
      if (allData.length > 0) {
        const data = allData as any[];
        const q = query.toLowerCase();
        const filtered = data
          .filter(
            (c: any) =>
              (c.name as string).toLowerCase().includes(q) ||
              (c.symbol as string).toLowerCase().includes(q) ||
              (c.id as string).toLowerCase().includes(q)
          )
          .slice(0, 10)
          .map((c) => {
            const mc = (c.market_cap as number) || 0;
            const vol = (c.total_volume as number) || 0;
            const liq = mc > 0 ? Math.min(100, Math.round((vol / mc) * 100 * 5)) : 0;
            const ch = (c.price_change_percentage_24h as number) || 0;
            const risk = liq > 60 ? Math.max(10, 100 - liq) : Math.min(90, 100 - liq + Math.abs(ch));

            return {
              name: c.name as string,
              symbol: (c.symbol as string).toUpperCase(),
              price: c.current_price as number,
              change24h: ch,
              marketCap: mc,
              volume: vol,
              liquidityScore: liq,
              riskScore: Math.round(Math.min(100, Math.max(0, risk))),
              momentum: ch > 5 ? "🟢 Fort" : ch > 0 ? "🟡 Modéré" : ch > -5 ? "🟠 Faible" : "🔴 Négatif",
              image: c.image as string,
            };
          });
        setResults(filtered);
      }
    } catch {
      // Use empty results
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0E1A] text-white">
      <Sidebar />
      <main className="ml-[260px]">
      <PageHeader
          icon={<Search className="w-6 h-6" />}
          title="AI Token Scanner"
          subtitle="Analysez n’importe quel token en profondeur : score de liquidité, niveau de risque, momentum et signaux IA. Évitez les pièges et trouvez les opportunités cachées."
          accentColor="blue"
          steps={[
            { n: "1", title: "Recherchez un token", desc: "Tapez le nom ou symbole d'un token dans la barre de recherche. L'IA analyse instantanément ses métriques clés." },
            { n: "2", title: "Évaluez les scores", desc: "Score de liquidité > 70 = bonne liquidité. Score de risque < 30 = risque faible. Momentum = direction de la tendance." },
            { n: "3", title: "Prenez une décision", desc: "Croisez le score IA avec votre analyse personnelle. Ne basez jamais une décision sur un seul indicateur." },
          ]}
        />
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
              <Search className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold">AI Token Scanner</h1>
              <p className="text-sm text-gray-400">Analysez n'importe quel token avec des données en temps réel</p>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="bg-[#111827] border border-white/[0.06] rounded-2xl p-5 mb-6">
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && searchTokens()}
                placeholder="Rechercher un token (ex: Bitcoin, ETH, Solana...)"
                className="w-full pl-12 pr-4 py-3.5 rounded-xl bg-black/30 border border-white/[0.08] text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500/50 transition-colors"
              />
            </div>
            <button
              onClick={searchTokens}
              disabled={loading}
              className="px-6 py-3.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 font-bold text-sm hover:brightness-110 transition-all disabled:opacity-50"
            >
              {loading ? "Analyse..." : "Scanner"}
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-3">
            💡 Entrez le nom ou le symbole d'un token pour obtenir une analyse complète (score de risque, liquidité, momentum)
          </p>
        </div>

        {/* Results */}
        {searched && results.length === 0 && !loading && (
          <div className="bg-[#111827] border border-white/[0.06] rounded-2xl p-10 text-center">
            <AlertTriangle className="w-12 h-12 text-amber-400 mx-auto mb-3" />
            <h3 className="text-lg font-bold mb-1">Aucun résultat</h3>
            <p className="text-sm text-gray-400">Essayez avec un autre nom ou symbole de token</p>
          </div>
        )}

        {results.length > 0 && (
          <div className="space-y-4">
            {results.map((token) => (
              <div
                key={token.symbol}
                className="bg-[#111827] border border-white/[0.06] rounded-2xl p-5 hover:border-white/[0.12] transition-all"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    {token.image ? (
                      <img src={token.image} alt={token.symbol} className="w-10 h-10 rounded-full" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-sm font-bold">
                        {token.symbol.slice(0, 2)}
                      </div>
                    )}
                    <div>
                      <h3 className="text-lg font-bold">{token.name}</h3>
                      <p className="text-sm text-gray-500">{token.symbol}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-extrabold">
                      ${token.price >= 1 ? token.price.toLocaleString("en-US", { maximumFractionDigits: 2 }) : token.price.toFixed(6)}
                    </p>
                    <p className={`text-sm font-bold ${token.change24h >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                      {token.change24h >= 0 ? "+" : ""}
                      {token.change24h.toFixed(2)}%
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                  <div className="bg-black/20 rounded-xl p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <BarChart3 className="w-4 h-4 text-gray-500" />
                      <span className="text-xs text-gray-500 font-semibold">Market Cap</span>
                    </div>
                    <p className="text-sm font-bold">{formatNum(token.marketCap)}</p>
                  </div>
                  <div className="bg-black/20 rounded-xl p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <Droplets className="w-4 h-4 text-gray-500" />
                      <span className="text-xs text-gray-500 font-semibold">Volume 24h</span>
                    </div>
                    <p className="text-sm font-bold">{formatNum(token.volume)}</p>
                  </div>
                  <div className="bg-black/20 rounded-xl p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp className="w-4 h-4 text-gray-500" />
                      <span className="text-xs text-gray-500 font-semibold">Momentum</span>
                    </div>
                    <p className="text-sm font-bold">{token.momentum}</p>
                  </div>
                  <div className="bg-black/20 rounded-xl p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <ExternalLink className="w-4 h-4 text-gray-500" />
                      <span className="text-xs text-gray-500 font-semibold">Explorer</span>
                    </div>
                    <a
                      href={`https://www.coingecko.com/en/coins/${token.name.toLowerCase().replace(/\s+/g, "-")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-bold text-indigo-400 hover:underline"
                    >
                      CoinGecko →
                    </a>
                  </div>
                </div>

                {/* Scores */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <Droplets className="w-4 h-4 text-cyan-400" />
                        <span className="text-xs font-semibold text-gray-400">Score Liquidité</span>
                      </div>
                      <span className="text-sm font-bold text-cyan-400">{token.liquidityScore}/100</span>
                    </div>
                    <ScoreBar value={token.liquidityScore} color="#06B6D4" />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <Shield className="w-4 h-4 text-amber-400" />
                        <span className="text-xs font-semibold text-gray-400">Score Risque</span>
                      </div>
                      <span className={`text-sm font-bold ${token.riskScore > 60 ? "text-red-400" : token.riskScore > 30 ? "text-amber-400" : "text-emerald-400"}`}>
                        {token.riskScore}/100
                      </span>
                    </div>
                    <ScoreBar value={token.riskScore} color={token.riskScore > 60 ? "#EF4444" : token.riskScore > 30 ? "#F59E0B" : "#10B981"} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Default state */}
        {!searched && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { icon: Shield, title: "Score de Risque", desc: "Évaluation automatique du risque basée sur la liquidité, le volume et la volatilité", color: "from-amber-500 to-orange-600" },
              { icon: Droplets, title: "Analyse Liquidité", desc: "Ratio volume/market cap pour évaluer la facilité d'achat et de vente", color: "from-cyan-500 to-blue-600" },
              { icon: TrendingUp, title: "Momentum IA", desc: "Détection des tendances haussières et baissières avec scoring intelligent", color: "from-emerald-500 to-green-600" },
            ].map((f, i) => (
              <div key={i} className="bg-[#111827] border border-white/[0.06] rounded-2xl p-6 text-center">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${f.color} flex items-center justify-center mx-auto mb-3`}>
                  <f.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-base font-bold mb-2">{f.title}</h3>
                <p className="text-sm text-gray-400">{f.desc}</p>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}