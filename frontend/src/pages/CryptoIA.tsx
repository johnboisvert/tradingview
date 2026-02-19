import { useEffect, useState } from "react";
import Sidebar from "@/components/Sidebar";
import { Bot, RefreshCw, TrendingUp, TrendingDown, Search, Activity, AlertCircle } from "lucide-react";

const API_URL = "https://crypto-prediction-api-5763.onrender.com";

interface CryptoItem {
  id: string;
  name: string;
  symbol: string;
  rank: number;
  price: number;
}

interface PredictionResult {
  current_price: number;
  predicted_price: number;
  price_change: number;
  signal: string;
  model_metrics?: { r2_score: number };
  market_data?: {
    low_24h: number;
    high_24h: number;
    price_change_percent: number;
  };
}

function formatPrice(price: number): string {
  if (!price) return "0.00";
  if (price >= 1000) return price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  if (price >= 1) return price.toFixed(4);
  return price.toFixed(8);
}

export default function CryptoIA() {
  const [apiStatus, setApiStatus] = useState<"checking" | "online" | "offline">("checking");
  const [cryptos, setCryptos] = useState<CryptoItem[]>([]);
  const [filteredCryptos, setFilteredCryptos] = useState<CryptoItem[]>([]);
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingList, setLoadingList] = useState(true);
  const [prediction, setPrediction] = useState<PredictionResult | null>(null);
  const [selectedCrypto, setSelectedCrypto] = useState<CryptoItem | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    checkStatus();
    loadCryptoList();
    const interval = setInterval(checkStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (search.trim() === "") {
      setFilteredCryptos(cryptos);
    } else {
      const q = search.toLowerCase();
      setFilteredCryptos(
        cryptos.filter(
          (c) =>
            c.name.toLowerCase().includes(q) ||
            c.symbol.toLowerCase().includes(q)
        )
      );
    }
  }, [search, cryptos]);

  async function checkStatus() {
    try {
      const res = await fetch(`${API_URL}/api/health`);
      const data = await res.json();
      setApiStatus(data.status === "online" ? "online" : "offline");
    } catch {
      setApiStatus("offline");
    }
  }

  async function loadCryptoList() {
    setLoadingList(true);
    try {
      const res = await fetch(`${API_URL}/api/crypto-list`);
      const data = await res.json();
      const list: CryptoItem[] = data.cryptos || [];
      setCryptos(list);
      setFilteredCryptos(list);
    } catch {
      setError("Impossible de charger la liste des cryptos. L'API est peut-être hors ligne.");
    } finally {
      setLoadingList(false);
    }
  }

  async function handlePredict() {
    if (!selectedId) return;
    setLoading(true);
    setError("");
    setPrediction(null);
    try {
      const res = await fetch(`${API_URL}/api/predict/${selectedId}`);
      const data = await res.json();
      if (data.error) throw new Error(data.message || data.error);
      setPrediction(data);
      setSelectedCrypto(cryptos.find((c) => c.id === selectedId) || null);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Erreur lors de la prédiction");
    } finally {
      setLoading(false);
    }
  }

  const signalColor =
    prediction?.signal?.includes("ACHET") || prediction?.signal?.includes("HAUSSE")
      ? "text-emerald-400"
      : prediction?.signal?.includes("VEND") || prediction?.signal?.includes("BAISSE")
      ? "text-red-400"
      : "text-amber-400";

  const signalBg =
    prediction?.signal?.includes("ACHET") || prediction?.signal?.includes("HAUSSE")
      ? "bg-emerald-500/10 border-emerald-500/30"
      : prediction?.signal?.includes("VEND") || prediction?.signal?.includes("BAISSE")
      ? "bg-red-500/10 border-red-500/30"
      : "bg-amber-500/10 border-amber-500/30";

  return (
    <div className="min-h-screen bg-[#0A0E1A] text-white">
      <Sidebar />
      <main className="ml-[260px] p-6 min-h-screen">
        {/* Header */}
        <div className="relative rounded-2xl overflow-hidden mb-6 h-[120px] bg-gradient-to-r from-blue-900/40 to-purple-900/40">
          <div className="absolute inset-0 bg-gradient-to-r from-[#0A0E1A]/90 via-[#0A0E1A]/60 to-transparent" />
          <div className="relative z-10 h-full flex items-center justify-between px-8">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <Bot className="w-7 h-7 text-blue-400" />
                <h1 className="text-2xl font-extrabold">Crypto IA</h1>
              </div>
              <p className="text-sm text-gray-400">
                Prédictions en temps réel • Modèle IA CoinGecko
              </p>
            </div>
            {/* Status */}
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/[0.06] border border-white/[0.08]">
              <span
                className={`w-2.5 h-2.5 rounded-full animate-pulse ${
                  apiStatus === "online"
                    ? "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]"
                    : apiStatus === "offline"
                    ? "bg-red-400"
                    : "bg-amber-400"
                }`}
              />
              <span className="text-xs font-semibold text-gray-300">
                {apiStatus === "online"
                  ? "API Connectée"
                  : apiStatus === "offline"
                  ? "API Hors ligne"
                  : "Connexion..."}
              </span>
            </div>
          </div>
        </div>

        {/* Search & Predict */}
        <div className="bg-[#111827] border border-white/[0.06] rounded-2xl p-6 mb-6">
          <h2 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">
            Sélectionner une cryptomonnaie
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search input */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="🔍 Rechercher une crypto..."
                className="w-full pl-9 pr-4 py-3 rounded-xl bg-black/30 border border-white/[0.08] text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 transition-all"
              />
            </div>

            {/* Dropdown */}
            <div className="relative">
              <select
                value={selectedId}
                onChange={(e) => setSelectedId(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-black/30 border border-white/[0.08] text-sm text-white focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 transition-all appearance-none cursor-pointer"
              >
                <option value="">
                  {loadingList ? "⏳ Chargement..." : "📊 Sélectionner une crypto..."}
                </option>
                {filteredCryptos.map((c) => (
                  <option key={c.id} value={c.id} className="bg-[#1e293b]">
                    #{c.rank} {c.name} ({c.symbol.toUpperCase()}) — ${formatPrice(c.price)}
                  </option>
                ))}
              </select>
            </div>

            {/* Predict button */}
            <button
              onClick={handlePredict}
              disabled={!selectedId || loading || apiStatus === "offline"}
              className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-bold text-sm transition-all shadow-lg shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Analyse en cours...
                </>
              ) : (
                <>
                  <Bot className="w-4 h-4" />
                  🚀 PRÉDIRE
                </>
              )}
            </button>
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div className="bg-[#111827] border border-white/[0.06] rounded-2xl p-16 text-center mb-6">
            <div className="w-16 h-16 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin mx-auto mb-6 shadow-[0_0_20px_rgba(59,130,246,0.3)]" />
            <h3 className="text-lg font-bold mb-2">🤖 Intelligence Artificielle en action...</h3>
            <p className="text-sm text-gray-400">Récupération des données et entraînement du modèle...</p>
          </div>
        )}

        {/* Error */}
        {error && !loading && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-6 mb-6 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-bold text-red-400 mb-1">Erreur lors de la prédiction</h3>
              <p className="text-sm text-gray-400">{error}</p>
            </div>
          </div>
        )}

        {/* Result */}
        {prediction && selectedCrypto && !loading && (
          <div className="space-y-4">
            {/* Crypto Header */}
            <div className="bg-[#111827] border border-white/[0.06] rounded-2xl p-6">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                  <h2 className="text-2xl font-extrabold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                    {selectedCrypto.name} ({selectedCrypto.symbol.toUpperCase()})
                  </h2>
                  <p className="text-sm text-gray-500 mt-1">Rang #{selectedCrypto.rank}</p>
                </div>
                <div className={`px-6 py-3 rounded-xl border-2 ${signalBg}`}>
                  <p className="text-xs text-gray-400 font-semibold mb-1 text-center uppercase tracking-widest">Signal IA</p>
                  <p className={`text-2xl font-extrabold text-center ${signalColor}`}>
                    {prediction.signal}
                  </p>
                </div>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-[#111827] border border-white/[0.06] rounded-2xl p-5 hover:border-blue-500/20 transition-all">
                <p className="text-xs text-gray-500 font-semibold uppercase tracking-widest mb-3">💰 Prix Actuel</p>
                <p className="text-2xl font-extrabold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                  ${formatPrice(prediction.current_price)}
                </p>
              </div>
              <div className="bg-[#111827] border border-white/[0.06] rounded-2xl p-5 hover:border-purple-500/20 transition-all">
                <p className="text-xs text-gray-500 font-semibold uppercase tracking-widest mb-3">🎯 Prix Prédit</p>
                <p className="text-2xl font-extrabold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                  ${formatPrice(prediction.predicted_price)}
                </p>
              </div>
              <div className="bg-[#111827] border border-white/[0.06] rounded-2xl p-5 hover:border-emerald-500/20 transition-all">
                <p className="text-xs text-gray-500 font-semibold uppercase tracking-widest mb-3">📈 Variation</p>
                <div className={`flex items-center gap-2 ${(prediction.price_change || 0) >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                  {(prediction.price_change || 0) >= 0 ? (
                    <TrendingUp className="w-5 h-5" />
                  ) : (
                    <TrendingDown className="w-5 h-5" />
                  )}
                  <span className="text-2xl font-extrabold">
                    {(prediction.price_change || 0) >= 0 ? "+" : ""}
                    {(prediction.price_change || 0).toFixed(2)}%
                  </span>
                </div>
              </div>
              <div className="bg-[#111827] border border-white/[0.06] rounded-2xl p-5 hover:border-amber-500/20 transition-all">
                <p className="text-xs text-gray-500 font-semibold uppercase tracking-widest mb-3">📊 Confiance R²</p>
                <div className="flex items-center gap-2">
                  <Activity className="w-5 h-5 text-amber-400" />
                  <span className="text-2xl font-extrabold text-amber-400">
                    {((prediction.model_metrics?.r2_score || 0.75) * 100).toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>

            {/* Market Data */}
            {prediction.market_data && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-[#111827] border border-white/[0.06] rounded-2xl p-5">
                  <p className="text-xs text-gray-500 font-semibold uppercase tracking-widest mb-3">📉 Plus Bas (24h)</p>
                  <p className="text-xl font-extrabold text-emerald-400/80">
                    ${formatPrice(prediction.market_data.low_24h || prediction.current_price * 0.98)}
                  </p>
                </div>
                <div className="bg-[#111827] border border-white/[0.06] rounded-2xl p-5">
                  <p className="text-xs text-gray-500 font-semibold uppercase tracking-widest mb-3">📈 Plus Haut (24h)</p>
                  <p className="text-xl font-extrabold text-red-400/80">
                    ${formatPrice(prediction.market_data.high_24h || prediction.current_price * 1.02)}
                  </p>
                </div>
                <div className="bg-[#111827] border border-white/[0.06] rounded-2xl p-5">
                  <p className="text-xs text-gray-500 font-semibold uppercase tracking-widest mb-3">🔄 Variation 24h</p>
                  <p className={`text-xl font-extrabold ${(prediction.market_data.price_change_percent || 0) >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                    {(prediction.market_data.price_change_percent || 0) >= 0 ? "+" : ""}
                    {(prediction.market_data.price_change_percent || 0).toFixed(2)}%
                  </p>
                </div>
              </div>
            )}

            {/* Disclaimer */}
            <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl px-4 py-3 flex items-center gap-2">
              <span className="text-amber-400 text-sm">⚠️</span>
              <p className="text-xs text-amber-400/80 font-semibold">
                Ces prédictions sont générées par un modèle IA et ne constituent pas un conseil financier. Investissez de manière responsable.
              </p>
            </div>
          </div>
        )}

        {/* Empty state */}
        {!prediction && !loading && !error && (
          <div className="bg-[#111827] border border-white/[0.06] rounded-2xl p-16 text-center">
            <Bot className="w-16 h-16 text-blue-400/30 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-gray-400 mb-2">Prêt à analyser</h3>
            <p className="text-sm text-gray-600">
              Sélectionnez une cryptomonnaie et cliquez sur <strong className="text-gray-400">PRÉDIRE</strong> pour obtenir une analyse IA en temps réel.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}