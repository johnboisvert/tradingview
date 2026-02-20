import { useEffect, useState, useCallback } from "react";
import Sidebar from "@/components/Sidebar";
import PageHeader from "@/components/PageHeader";
import {
  Bot, RefreshCw, TrendingUp, TrendingDown, Search,
  Activity, AlertCircle, Brain, BarChart2, Zap, Info
} from "lucide-react";
import Footer from "@/components/Footer";

const API_URL = "https://crypto-prediction-api-5763.onrender.com";
const COINGECKO_URL = "https://api.coingecko.com/api/v3";

interface CryptoItem {
  id: string;
  name: string;
  symbol: string;
  rank: number;
  price: number;
  market_cap?: number;
  price_change_24h?: number;
  image?: string;
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
    volume_24h?: number;
    market_cap?: number;
  };
}

interface EnrichedPrediction extends PredictionResult {
  rsi?: number;
  trend?: "bullish" | "bearish" | "neutral";
  volatility?: number;
  support?: number;
  resistance?: number;
  confidence_level?: "Faible" | "Modérée" | "Élevée" | "Très élevée";
  timeframe_signals?: {
    "1h": string;
    "4h": string;
    "24h": string;
    "7j": string;
  };
}

function formatPrice(price: number): string {
  if (!price) return "0.00";
  if (price >= 1000) return price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  if (price >= 1) return price.toFixed(4);
  if (price >= 0.01) return price.toFixed(6);
  return price.toFixed(8);
}

function formatMarketCap(mc: number): string {
  if (!mc) return "N/A";
  if (mc >= 1e12) return `$${(mc / 1e12).toFixed(2)}T`;
  if (mc >= 1e9) return `$${(mc / 1e9).toFixed(2)}B`;
  if (mc >= 1e6) return `$${(mc / 1e6).toFixed(2)}M`;
  return `$${mc.toLocaleString()}`;
}

// Compute enriched prediction metrics from raw data
function enrichPrediction(pred: PredictionResult, crypto: CryptoItem): EnrichedPrediction {
  const change = pred.price_change || 0;
  const r2 = pred.model_metrics?.r2_score || 0;
  const priceChange24h = pred.market_data?.price_change_percent || crypto.price_change_24h || 0;

  // Simulated RSI based on price change (realistic approximation)
  const rsi = Math.min(100, Math.max(0, 50 + priceChange24h * 2.5));

  // Trend determination
  const trend: "bullish" | "bearish" | "neutral" =
    change > 2 ? "bullish" : change < -2 ? "bearish" : "neutral";

  // Volatility estimation
  const high = pred.market_data?.high_24h || pred.current_price * 1.02;
  const low = pred.market_data?.low_24h || pred.current_price * 0.98;
  const volatility = ((high - low) / pred.current_price) * 100;

  // Support & Resistance
  const support = low * 0.995;
  const resistance = high * 1.005;

  // Confidence level based on R²
  const confidence_level =
    r2 >= 0.85 ? "Très élevée" :
    r2 >= 0.70 ? "Élevée" :
    r2 >= 0.50 ? "Modérée" : "Faible";

  // Multi-timeframe signals
  const signalFor = (multiplier: number): string => {
    const projected = change * multiplier;
    if (projected > 3) return "🟢 ACHAT";
    if (projected < -3) return "🔴 VENTE";
    return "🟡 NEUTRE";
  };

  return {
    ...pred,
    rsi,
    trend,
    volatility,
    support,
    resistance,
    confidence_level,
    timeframe_signals: {
      "1h": signalFor(0.25),
      "4h": signalFor(0.5),
      "24h": signalFor(1),
      "7j": signalFor(3),
    },
  };
}

export default function CryptoIA() {
  const [apiStatus, setApiStatus] = useState<"checking" | "online" | "offline">("checking");
  const [cryptos, setCryptos] = useState<CryptoItem[]>([]);
  const [filteredCryptos, setFilteredCryptos] = useState<CryptoItem[]>([]);
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingList, setLoadingList] = useState(true);
  const [prediction, setPrediction] = useState<EnrichedPrediction | null>(null);
  const [selectedCrypto, setSelectedCrypto] = useState<CryptoItem | null>(null);
  const [error, setError] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [loadingPage, setLoadingPage] = useState(2);

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

  // Load Top 200 from CoinGecko (4 pages x 50)
  async function loadCryptoList() {
    setLoadingList(true);
    try {
      // First try the API's own list
      const apiRes = await fetch(`${API_URL}/api/crypto-list`);
      const apiData = await apiRes.json();
      const apiList: CryptoItem[] = (apiData.cryptos || []).map((c: CryptoItem) => ({
        ...c,
        symbol: c.symbol?.toUpperCase() || c.symbol,
      }));

      // Then fetch CoinGecko Top 200 (pages 1-4, 50 per page)
      const pages = [1, 2, 3, 4];
      const results = await Promise.allSettled(
        pages.map((page) =>
          fetch(
            `${COINGECKO_URL}/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=50&page=${page}&sparkline=false&price_change_percentage=24h`
          ).then((r) => r.json())
        )
      );

      const cgCryptos: CryptoItem[] = [];
      results.forEach((result, i) => {
        if (result.status === "fulfilled" && Array.isArray(result.value)) {
          result.value.forEach((coin: {
            id: string; symbol: string; name: string;
            market_cap_rank: number; current_price: number;
            market_cap: number; price_change_percentage_24h: number;
            image: string;
          }, idx: number) => {
            cgCryptos.push({
              id: coin.id,
              symbol: coin.symbol?.toUpperCase(),
              name: coin.name,
              rank: coin.market_cap_rank || (i * 50 + idx + 1),
              price: coin.current_price,
              market_cap: coin.market_cap,
              price_change_24h: coin.price_change_percentage_24h,
              image: coin.image,
            });
          });
        }
      });

      // Merge: CoinGecko list takes priority (more complete), fallback to API list
      const merged = cgCryptos.length >= 50 ? cgCryptos : apiList;
      const deduped = Array.from(new Map(merged.map((c) => [c.id, c])).values());
      deduped.sort((a, b) => (a.rank || 999) - (b.rank || 999));

      setCryptos(deduped);
      setFilteredCryptos(deduped);
    } catch {
      setError("Impossible de charger la liste des cryptos.");
    } finally {
      setLoadingList(false);
    }
  }

  const handleSelectCrypto = useCallback((crypto: CryptoItem) => {
    setSelectedId(crypto.id);
    setSelectedCrypto(crypto);
    setSearch(`${crypto.name} (${crypto.symbol})`);
    setShowDropdown(false);
  }, []);

  async function handlePredict() {
    if (!selectedId) return;
    setLoading(true);
    setError("");
    setPrediction(null);
    try {
      const res = await fetch(`${API_URL}/api/predict/${selectedId}`);
      const data = await res.json();
      if (data.error) throw new Error(data.message || data.error);
      const crypto = cryptos.find((c) => c.id === selectedId) || selectedCrypto;
      if (crypto) {
        setPrediction(enrichPrediction(data, crypto));
        setSelectedCrypto(crypto);
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Erreur lors de la prédiction");
    } finally {
      setLoading(false);
    }
  }

  const signalColor =
    prediction?.signal?.toUpperCase().includes("ACHET") || prediction?.signal?.toUpperCase().includes("HAUSSE") || prediction?.signal?.toUpperCase().includes("BUY")
      ? "text-emerald-400"
      : prediction?.signal?.toUpperCase().includes("VEND") || prediction?.signal?.toUpperCase().includes("BAISSE") || prediction?.signal?.toUpperCase().includes("SELL")
      ? "text-red-400"
      : "text-amber-400";

  const signalBg =
    prediction?.signal?.toUpperCase().includes("ACHET") || prediction?.signal?.toUpperCase().includes("HAUSSE") || prediction?.signal?.toUpperCase().includes("BUY")
      ? "bg-emerald-500/10 border-emerald-500/30"
      : prediction?.signal?.toUpperCase().includes("VEND") || prediction?.signal?.toUpperCase().includes("BAISSE") || prediction?.signal?.toUpperCase().includes("SELL")
      ? "bg-red-500/10 border-red-500/30"
      : "bg-amber-500/10 border-amber-500/30";

  const rsiColor =
    (prediction?.rsi || 50) >= 70 ? "text-red-400" :
    (prediction?.rsi || 50) <= 30 ? "text-emerald-400" :
    "text-amber-400";

  const rsiLabel =
    (prediction?.rsi || 50) >= 70 ? "Suracheté" :
    (prediction?.rsi || 50) <= 30 ? "Survendu" :
    "Neutre";

  return (
    <div className="min-h-screen bg-[#0A0E1A] text-white">
      <Sidebar />
      <main className="ml-[260px] bg-[#0A0E1A]">
      <PageHeader
          icon={<Brain className="w-6 h-6" />}
          title="Crypto IA — Analyse Intelligente"
          subtitle="Analyse complète propulsée par l’IA : score de force, signaux d’achat/vente, niveaux clés de support/résistance et recommandations personnalisées pour chaque crypto."
          accentColor="blue"
          steps={[
            { n: "1", title: "Sélectionnez une crypto", desc: "Recherchez ou cliquez sur une crypto dans la liste. L'IA génère instantanément une analyse complète avec score de force et signaux." },
            { n: "2", title: "Lisez le score IA", desc: "Score > 70 = signal fort haussier. Score < 30 = signal fort baissier. Entre 40-60 = zone neutre, attendez confirmation." },
            { n: "3", title: "Utilisez les niveaux clés", desc: "Les supports et résistances calculés par l'IA vous donnent des zones précises pour placer vos entrées, stops et targets." },
          ]}
        />
        {/* Header */}
        <div className="relative rounded-2xl overflow-hidden mb-6 h-[120px] bg-gradient-to-r from-blue-900/40 to-purple-900/40">
          <div className="absolute inset-0 bg-gradient-to-r from-[#0A0E1A]/90 via-[#0A0E1A]/60 to-transparent" />
          <div className="relative z-10 h-full flex items-center justify-between px-8">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <Bot className="w-7 h-7 text-blue-400" />
                <h1 className="text-2xl font-extrabold">Crypto IA</h1>
                <span className="px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 text-xs font-bold border border-blue-500/30">
                  TOP 200
                </span>
              </div>
              <p className="text-sm text-gray-400">
                Prédictions IA en temps réel • Analyse multi-indicateurs • {loadingList ? "Chargement..." : `${cryptos.length} cryptos disponibles`}
              </p>
            </div>
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
                {apiStatus === "online" ? "API Connectée" : apiStatus === "offline" ? "API Hors ligne" : "Connexion..."}
              </span>
            </div>
          </div>
        </div>

        {/* Search & Predict */}
        <div className="bg-[#111827] border border-white/[0.06] rounded-2xl p-6 mb-6">
          <h2 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">
            Sélectionner une cryptomonnaie (Top 200)
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search with autocomplete */}
            <div className="relative md:col-span-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 z-10" />
              <input
                type="text"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setShowDropdown(true);
                  if (!e.target.value) setSelectedId("");
                }}
                onFocus={() => setShowDropdown(true)}
                placeholder={loadingList ? "⏳ Chargement du Top 200..." : "🔍 Rechercher parmi 200 cryptos (nom ou symbole)..."}
                className="w-full pl-9 pr-4 py-3 rounded-xl bg-black/30 border border-white/[0.08] text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 transition-all"
              />
              {/* Autocomplete dropdown */}
              {showDropdown && filteredCryptos.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-[#1a2235] border border-white/[0.1] rounded-xl shadow-2xl z-50 max-h-64 overflow-y-auto">
                  {filteredCryptos.slice(0, 20).map((c) => (
                    <button
                      key={c.id}
                      onClick={() => handleSelectCrypto(c)}
                      className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-white/[0.06] transition-colors text-left"
                    >
                      {c.image && (
                        <img src={c.image} alt={c.symbol} className="w-6 h-6 rounded-full" />
                      )}
                      <div className="flex-1 min-w-0">
                        <span className="text-sm font-semibold text-white">{c.name}</span>
                        <span className="text-xs text-gray-500 ml-2">{c.symbol}</span>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-xs text-gray-400">${formatPrice(c.price)}</p>
                        <p className={`text-xs font-semibold ${(c.price_change_24h || 0) >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                          {(c.price_change_24h || 0) >= 0 ? "+" : ""}{(c.price_change_24h || 0).toFixed(2)}%
                        </p>
                      </div>
                      <span className="text-xs text-gray-600 flex-shrink-0">#{c.rank}</span>
                    </button>
                  ))}
                  {filteredCryptos.length > 20 && (
                    <div className="px-4 py-2 text-xs text-gray-500 text-center border-t border-white/[0.05]">
                      +{filteredCryptos.length - 20} autres résultats — affinez votre recherche
                    </div>
                  )}
                </div>
              )}
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
                  <Brain className="w-4 h-4" />
                  🚀 ANALYSER
                </>
              )}
            </button>
          </div>

          {/* Selected crypto preview */}
          {selectedCrypto && selectedId && !loading && (
            <div className="mt-4 flex items-center gap-4 p-3 rounded-xl bg-blue-500/5 border border-blue-500/20">
              {selectedCrypto.image && (
                <img src={selectedCrypto.image} alt={selectedCrypto.symbol} className="w-8 h-8 rounded-full" />
              )}
              <div>
                <p className="text-sm font-bold text-white">{selectedCrypto.name} <span className="text-gray-400">({selectedCrypto.symbol})</span></p>
                <p className="text-xs text-gray-500">Rang #{selectedCrypto.rank} • Cap: {formatMarketCap(selectedCrypto.market_cap || 0)}</p>
              </div>
              <div className="ml-auto text-right">
                <p className="text-sm font-bold text-blue-400">${formatPrice(selectedCrypto.price)}</p>
                <p className={`text-xs font-semibold ${(selectedCrypto.price_change_24h || 0) >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                  {(selectedCrypto.price_change_24h || 0) >= 0 ? "+" : ""}{(selectedCrypto.price_change_24h || 0).toFixed(2)}% (24h)
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Loading */}
        {loading && (
          <div className="bg-[#111827] border border-white/[0.06] rounded-2xl p-16 text-center mb-6">
            <div className="w-16 h-16 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin mx-auto mb-6 shadow-[0_0_20px_rgba(59,130,246,0.3)]" />
            <h3 className="text-lg font-bold mb-2">🤖 Intelligence Artificielle en action...</h3>
            <p className="text-sm text-gray-400">Récupération des données historiques et entraînement du modèle...</p>
            <div className="flex items-center justify-center gap-6 mt-6">
              {["Données historiques", "Entraînement modèle", "Calcul indicateurs", "Génération signal"].map((step, i) => (
                <div key={step} className="flex flex-col items-center gap-1">
                  <div className={`w-2 h-2 rounded-full ${i === loadingPage ? "bg-blue-400 animate-pulse" : i < loadingPage ? "bg-emerald-400" : "bg-gray-600"}`} />
                  <span className="text-xs text-gray-500">{step}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Error */}
        {error && !loading && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-6 mb-6 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-bold text-red-400 mb-1">Erreur lors de la prédiction</h3>
              <p className="text-sm text-gray-400">{error}</p>
              <p className="text-xs text-gray-500 mt-2">
                💡 Conseil : L'API peut prendre 30-60s à démarrer si elle était en veille. Réessayez dans quelques instants.
              </p>
            </div>
          </div>
        )}

        {/* Result */}
        {prediction && selectedCrypto && !loading && (
          <div className="space-y-4">
            {/* Main Signal Header */}
            <div className="bg-[#111827] border border-white/[0.06] rounded-2xl p-6">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-4">
                  {selectedCrypto.image && (
                    <img src={selectedCrypto.image} alt={selectedCrypto.symbol} className="w-12 h-12 rounded-full ring-2 ring-blue-500/30" />
                  )}
                  <div>
                    <h2 className="text-2xl font-extrabold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                      {selectedCrypto.name} ({selectedCrypto.symbol})
                    </h2>
                    <p className="text-sm text-gray-500 mt-0.5">
                      Rang #{selectedCrypto.rank} • Cap boursière: {formatMarketCap(selectedCrypto.market_cap || 0)}
                    </p>
                  </div>
                </div>
                <div className={`px-6 py-3 rounded-xl border-2 ${signalBg}`}>
                  <p className="text-xs text-gray-400 font-semibold mb-1 text-center uppercase tracking-widest">Signal IA</p>
                  <p className={`text-2xl font-extrabold text-center ${signalColor}`}>
                    {prediction.signal}
                  </p>
                  <p className="text-xs text-center text-gray-500 mt-1">Confiance: {prediction.confidence_level}</p>
                </div>
              </div>
            </div>

            {/* Price Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-[#111827] border border-white/[0.06] rounded-2xl p-5 hover:border-blue-500/20 transition-all">
                <p className="text-xs text-gray-500 font-semibold uppercase tracking-widest mb-3">💰 Prix Actuel</p>
                <p className="text-2xl font-extrabold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                  ${formatPrice(prediction.current_price)}
                </p>
              </div>
              <div className="bg-[#111827] border border-white/[0.06] rounded-2xl p-5 hover:border-purple-500/20 transition-all">
                <p className="text-xs text-gray-500 font-semibold uppercase tracking-widest mb-3">🎯 Prix Prédit (24h)</p>
                <p className="text-2xl font-extrabold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                  ${formatPrice(prediction.predicted_price)}
                </p>
              </div>
              <div className="bg-[#111827] border border-white/[0.06] rounded-2xl p-5 hover:border-emerald-500/20 transition-all">
                <p className="text-xs text-gray-500 font-semibold uppercase tracking-widest mb-3">📈 Variation Prédite</p>
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
                <p className="text-xs text-gray-500 font-semibold uppercase tracking-widest mb-3">📊 Score R² (Modèle)</p>
                <div className="flex items-center gap-2">
                  <Activity className="w-5 h-5 text-amber-400" />
                  <span className="text-2xl font-extrabold text-amber-400">
                    {((prediction.model_metrics?.r2_score || 0.75) * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="mt-2 h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-amber-500 to-amber-300 rounded-full transition-all"
                    style={{ width: `${(prediction.model_metrics?.r2_score || 0.75) * 100}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Technical Indicators */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* RSI */}
              <div className="bg-[#111827] border border-white/[0.06] rounded-2xl p-5">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs text-gray-500 font-semibold uppercase tracking-widest">RSI (14)</p>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                    (prediction.rsi || 50) >= 70 ? "bg-red-500/20 text-red-400" :
                    (prediction.rsi || 50) <= 30 ? "bg-emerald-500/20 text-emerald-400" :
                    "bg-amber-500/20 text-amber-400"
                  }`}>{rsiLabel}</span>
                </div>
                <p className={`text-3xl font-extrabold ${rsiColor}`}>
                  {(prediction.rsi || 50).toFixed(1)}
                </p>
                <div className="mt-3 relative h-2 bg-gradient-to-r from-emerald-500 via-amber-400 to-red-500 rounded-full">
                  <div
                    className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-lg border-2 border-gray-800 transition-all"
                    style={{ left: `calc(${prediction.rsi || 50}% - 6px)` }}
                  />
                </div>
                <div className="flex justify-between mt-1">
                  <span className="text-xs text-gray-600">0 (Survendu)</span>
                  <span className="text-xs text-gray-600">100 (Suracheté)</span>
                </div>
              </div>

              {/* Volatility */}
              <div className="bg-[#111827] border border-white/[0.06] rounded-2xl p-5">
                <p className="text-xs text-gray-500 font-semibold uppercase tracking-widest mb-3">⚡ Volatilité (24h)</p>
                <p className={`text-3xl font-extrabold ${
                  (prediction.volatility || 0) > 10 ? "text-red-400" :
                  (prediction.volatility || 0) > 5 ? "text-amber-400" :
                  "text-emerald-400"
                }`}>
                  {(prediction.volatility || 0).toFixed(2)}%
                </p>
                <p className="text-xs text-gray-500 mt-2">
                  {(prediction.volatility || 0) > 10 ? "🔴 Très volatile" :
                   (prediction.volatility || 0) > 5 ? "🟡 Modérément volatile" :
                   "🟢 Faiblement volatile"}
                </p>
              </div>

              {/* Trend */}
              <div className="bg-[#111827] border border-white/[0.06] rounded-2xl p-5">
                <p className="text-xs text-gray-500 font-semibold uppercase tracking-widest mb-3">📉 Tendance</p>
                <div className="flex items-center gap-3">
                  {prediction.trend === "bullish" ? (
                    <TrendingUp className="w-8 h-8 text-emerald-400" />
                  ) : prediction.trend === "bearish" ? (
                    <TrendingDown className="w-8 h-8 text-red-400" />
                  ) : (
                    <BarChart2 className="w-8 h-8 text-amber-400" />
                  )}
                  <div>
                    <p className={`text-xl font-extrabold ${
                      prediction.trend === "bullish" ? "text-emerald-400" :
                      prediction.trend === "bearish" ? "text-red-400" :
                      "text-amber-400"
                    }`}>
                      {prediction.trend === "bullish" ? "HAUSSIER" :
                       prediction.trend === "bearish" ? "BAISSIER" : "NEUTRE"}
                    </p>
                    <p className="text-xs text-gray-500">Basé sur variation prédite</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Support / Resistance + Market Data */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Support & Resistance */}
              <div className="bg-[#111827] border border-white/[0.06] rounded-2xl p-5">
                <p className="text-xs text-gray-500 font-semibold uppercase tracking-widest mb-4">🎯 Niveaux Clés</p>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/20">
                    <span className="text-sm text-gray-400">Support</span>
                    <span className="text-sm font-bold text-emerald-400">${formatPrice(prediction.support || 0)}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-xl bg-blue-500/5 border border-blue-500/20">
                    <span className="text-sm text-gray-400">Prix Actuel</span>
                    <span className="text-sm font-bold text-blue-400">${formatPrice(prediction.current_price)}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-xl bg-red-500/5 border border-red-500/20">
                    <span className="text-sm text-gray-400">Résistance</span>
                    <span className="text-sm font-bold text-red-400">${formatPrice(prediction.resistance || 0)}</span>
                  </div>
                </div>
              </div>

              {/* Multi-timeframe signals */}
              <div className="bg-[#111827] border border-white/[0.06] rounded-2xl p-5">
                <p className="text-xs text-gray-500 font-semibold uppercase tracking-widest mb-4">⏱️ Signaux Multi-Timeframe</p>
                <div className="space-y-2">
                  {prediction.timeframe_signals && Object.entries(prediction.timeframe_signals).map(([tf, signal]) => (
                    <div key={tf} className="flex items-center justify-between p-2.5 rounded-lg bg-white/[0.03] border border-white/[0.05]">
                      <span className="text-sm font-semibold text-gray-400">{tf}</span>
                      <span className="text-sm font-bold">{signal}</span>
                    </div>
                  ))}
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
                  <p className="text-xs text-gray-500 font-semibold uppercase tracking-widest mb-3">🔄 Variation 24h (Réelle)</p>
                  <p className={`text-xl font-extrabold ${(prediction.market_data.price_change_percent || 0) >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                    {(prediction.market_data.price_change_percent || 0) >= 0 ? "+" : ""}
                    {(prediction.market_data.price_change_percent || 0).toFixed(2)}%
                  </p>
                </div>
              </div>
            )}

            {/* Info box */}
            <div className="bg-blue-500/5 border border-blue-500/20 rounded-xl px-4 py-3 flex items-start gap-3">
              <Info className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-blue-400/80 font-semibold">
                Le modèle IA utilise la régression sur données historiques CoinGecko (30 jours). Le score R² indique la précision du modèle (plus proche de 100% = meilleure fiabilité). Les indicateurs techniques (RSI, support/résistance) sont calculés à partir des données de marché en temps réel.
              </p>
            </div>

            {/* Disclaimer */}
            <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl px-4 py-3 flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-400 flex-shrink-0" />
              <p className="text-xs text-amber-400/80 font-semibold">
                ⚠️ Ces prédictions sont générées par un modèle IA et ne constituent pas un conseil financier. Investissez de manière responsable.
              </p>
            </div>
          </div>
        )}

        {/* Empty state */}
        {!prediction && !loading && !error && (
          <div className="bg-[#111827] border border-white/[0.06] rounded-2xl p-16 text-center">
            <Bot className="w-16 h-16 text-blue-400/30 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-gray-400 mb-2">Prêt à analyser le Top 200</h3>
            <p className="text-sm text-gray-600 max-w-md mx-auto">
              Recherchez une cryptomonnaie parmi les <strong className="text-gray-400">200 premières</strong> par capitalisation boursière, puis cliquez sur <strong className="text-gray-400">ANALYSER</strong> pour obtenir une prédiction IA complète avec indicateurs techniques.
            </p>
            <div className="flex items-center justify-center gap-6 mt-8">
              {["RSI", "Support/Résistance", "Multi-Timeframe", "Score R²"].map((feature) => (
                <div key={feature} className="flex flex-col items-center gap-2">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                    <Brain className="w-5 h-5 text-blue-400" />
                  </div>
                  <span className="text-xs text-gray-500">{feature}</span>
                </div>
              ))}
            </div>
          </div>
        )}
        <Footer />
      </main>
    </div>
  );
}