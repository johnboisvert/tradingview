import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Sidebar from "@/components/Sidebar";
import SEOHead from "@/components/SEOHead";
import Footer from "@/components/Footer";
import ShareButtons from "@/components/ShareButtons";
import { TrendingUp, TrendingDown, Search, BarChart3 } from "lucide-react";
import { fetchTop200, type CoinMarketData } from "@/lib/cryptoApi";

/* ── Top cryptos for SEO pages ── */
const SEO_CRYPTOS = [
  { id: "bitcoin", name: "Bitcoin", symbol: "BTC" },
  { id: "ethereum", name: "Ethereum", symbol: "ETH" },
  { id: "solana", name: "Solana", symbol: "SOL" },
  { id: "binancecoin", name: "BNB", symbol: "BNB" },
  { id: "ripple", name: "XRP", symbol: "XRP" },
  { id: "cardano", name: "Cardano", symbol: "ADA" },
  { id: "dogecoin", name: "Dogecoin", symbol: "DOGE" },
  { id: "avalanche-2", name: "Avalanche", symbol: "AVAX" },
  { id: "polkadot", name: "Polkadot", symbol: "DOT" },
  { id: "chainlink", name: "Chainlink", symbol: "LINK" },
  { id: "matic-network", name: "Polygon", symbol: "MATIC" },
  { id: "litecoin", name: "Litecoin", symbol: "LTC" },
  { id: "uniswap", name: "Uniswap", symbol: "UNI" },
  { id: "stellar", name: "Stellar", symbol: "XLM" },
  { id: "cosmos", name: "Cosmos", symbol: "ATOM" },
  { id: "algorand", name: "Algorand", symbol: "ALGO" },
  { id: "vechain", name: "VeChain", symbol: "VET" },
  { id: "fantom", name: "Fantom", symbol: "FTM" },
  { id: "tron", name: "Tron", symbol: "TRX" },
  { id: "near", name: "NEAR Protocol", symbol: "NEAR" },
  { id: "sui", name: "Sui", symbol: "SUI" },
  { id: "aptos", name: "Aptos", symbol: "APT" },
  { id: "arbitrum", name: "Arbitrum", symbol: "ARB" },
  { id: "optimism", name: "Optimism", symbol: "OP" },
  { id: "injective-protocol", name: "Injective", symbol: "INJ" },
  { id: "hedera-hashgraph", name: "Hedera", symbol: "HBAR" },
  { id: "aave", name: "Aave", symbol: "AAVE" },
  { id: "the-graph", name: "The Graph", symbol: "GRT" },
  { id: "render-token", name: "Render", symbol: "RNDR" },
  { id: "pepe", name: "Pepe", symbol: "PEPE" },
];

export { SEO_CRYPTOS };

function formatPrice(price: number): string {
  if (price >= 1) return price.toLocaleString("fr-CA", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  if (price >= 0.01) return price.toFixed(4);
  return price.toFixed(8);
}

export default function Predictions() {
  const [coins, setCoins] = useState<CoinMarketData[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTop200()
      .then((data) => setCoins(data))
      .finally(() => setLoading(false));
  }, []);

  const getCoinData = (id: string) => coins.find((c) => c.id === id);

  const filtered = SEO_CRYPTOS.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.symbol.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#0A0E1A] text-white">
      <SEOHead
        title="Prédictions Crypto par IA 2025-2026"
        description="Analyses et prédictions IA pour Bitcoin, Ethereum, Solana et 30+ cryptomonnaies. Graphiques en temps réel, indicateurs techniques et signaux de trading."
        path="/predictions"
      />
      <Sidebar />
      <main className="md:ml-[260px] p-4 md:p-6 pt-[72px] md:pt-6 min-h-screen">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-3">
            <BarChart3 className="w-8 h-8 text-indigo-400" />
            <h1 className="text-4xl font-extrabold bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              Prédictions Crypto par IA
            </h1>
          </div>
          <p className="text-gray-400 max-w-2xl mx-auto">
            Analyses en temps réel et prédictions alimentées par l'intelligence artificielle pour les principales cryptomonnaies.
            Cliquez sur une crypto pour voir son analyse détaillée.
          </p>
        </div>

        {/* Search */}
        <div className="max-w-md mx-auto mb-8">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              placeholder="Rechercher une crypto..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-white/[0.04] border border-white/[0.08] rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500/50"
            />
          </div>
        </div>

        {/* Grid */}
        {loading ? (
          <div className="text-center py-20 text-gray-500">Chargement des données...</div>
        ) : (
          <div className="grid lg:grid-cols-4 md:grid-cols-3 sm:grid-cols-2 gap-4 max-w-7xl mx-auto">
            {filtered.map((crypto) => {
              const data = getCoinData(crypto.id);
              const change24h = data?.price_change_percentage_24h ?? 0;
              const isUp = change24h >= 0;

              return (
                <Link
                  key={crypto.id}
                  to={`/prediction/${crypto.id}`}
                  className="group bg-white/[0.03] border border-white/[0.06] rounded-2xl p-5 hover:bg-white/[0.06] hover:border-indigo-500/30 transition-all"
                >
                  <div className="flex items-center gap-3 mb-3">
                    {data?.image && (
                      <img src={data.image} alt={crypto.name} className="w-10 h-10 rounded-full" />
                    )}
                    <div>
                      <h2 className="font-bold text-white group-hover:text-indigo-300 transition-colors">
                        {crypto.name}
                      </h2>
                      <span className="text-xs text-gray-500 uppercase">{crypto.symbol}</span>
                    </div>
                  </div>

                  <div className="flex items-end justify-between">
                    <div>
                      <p className="text-xl font-bold text-white">
                        ${data ? formatPrice(data.current_price) : "—"}
                      </p>
                      <p className="text-xs text-gray-500">USD</p>
                    </div>
                    <div className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold ${isUp ? "bg-emerald-500/15 text-emerald-400" : "bg-red-500/15 text-red-400"}`}>
                      {isUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                      {change24h.toFixed(2)}%
                    </div>
                  </div>

                  <div className="mt-3 pt-3 border-t border-white/[0.04]">
                    <p className="text-[11px] text-indigo-400 font-medium group-hover:text-indigo-300 transition-colors">
                      Voir l'analyse IA →
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        {/* SEO text */}
        <div className="max-w-3xl mx-auto mt-12 mb-8">
          <div className="bg-white/[0.02] border border-white/[0.04] rounded-2xl p-6">
            <h2 className="text-lg font-bold mb-3 text-indigo-300">
              Prédictions Crypto IA — Comment ça marche ?
            </h2>
            <p className="text-sm text-gray-400 leading-relaxed mb-3">
              CryptoIA utilise des algorithmes d'intelligence artificielle avancés pour analyser les marchés crypto en temps réel.
              Nos modèles combinent l'analyse technique (RSI, MACD, Stochastique, Moyennes Mobiles), l'analyse on-chain,
              le sentiment du marché et les données fondamentales pour générer des prédictions fiables.
            </p>
            <p className="text-sm text-gray-400 leading-relaxed">
              Chaque page de prédiction inclut un graphique en chandeliers japonais alimenté par Binance,
              des indicateurs techniques calculés en temps réel, et un résumé IA de la tendance actuelle.
              Nos analyses couvrent Bitcoin (BTC), Ethereum (ETH), Solana (SOL), et plus de 30 autres cryptomonnaies majeures.
            </p>
          </div>
        </div>
      </main>
      <Footer />
      <ShareButtons title="Prédictions Crypto par IA — CryptoIA" />
    </div>
  );
}