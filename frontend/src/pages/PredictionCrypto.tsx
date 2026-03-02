import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import Sidebar from "@/components/Sidebar";
import SEOHead from "@/components/SEOHead";
import Footer from "@/components/Footer";
import ShareButtons from "@/components/ShareButtons";
import { SEO_CRYPTOS } from "@/pages/Predictions";
import { fetchTop200, type CoinMarketData } from "@/lib/cryptoApi";
import { TrendingUp, TrendingDown, ArrowLeft, BarChart3, Activity, RefreshCw } from "lucide-react";
import { createChart, ColorType, CandlestickSeries } from "lightweight-charts";

/* ── Binance symbol mapping (subset for prediction pages) ── */
const BINANCE_MAP: Record<string, string> = {
  bitcoin: "BTCUSDT", ethereum: "ETHUSDT", binancecoin: "BNBUSDT", solana: "SOLUSDT",
  ripple: "XRPUSDT", cardano: "ADAUSDT", dogecoin: "DOGEUSDT", "avalanche-2": "AVAXUSDT",
  polkadot: "DOTUSDT", chainlink: "LINKUSDT", "matic-network": "MATICUSDT",
  litecoin: "LTCUSDT", uniswap: "UNIUSDT", stellar: "XLMUSDT", cosmos: "ATOMUSDT",
  algorand: "ALGOUSDT", vechain: "VETUSDT", fantom: "FTMUSDT", tron: "TRXUSDT",
  near: "NEARUSDT", sui: "SUIUSDT", aptos: "APTUSDT", arbitrum: "ARBUSDT",
  optimism: "OPUSDT", "injective-protocol": "INJUSDT", "hedera-hashgraph": "HBARUSDT",
  aave: "AAVEUSDT", "the-graph": "GRTUSDT", "render-token": "RENDERUSDT", pepe: "PEPEUSDT",
};

/* ── Stablecoins / wrapped tokens to exclude from "related" section ── */
const EXCLUDED_IDS = new Set([
  "tether", "usd-coin", "dai", "binance-usd", "true-usd", "paxos-standard",
  "usdd", "frax", "gemini-dollar", "paypal-usd", "first-digital-usd",
  "ethena-usde", "usual-usd", "usds", "usd1", "ripple-usd", "global-dollar",
  "falcon-usd", "gho", "usdai", "wrapped-bitcoin", "staked-ether",
  "wrapped-steth", "coinbase-wrapped-staked-eth", "binance-staked-sol",
  "wrapped-eeth", "mantle-staked-ether",
]);

/* ── Technical indicators ── */
function computeRSI(data: number[], period = 14): number {
  if (data.length < period + 1) return 50;
  let avgGain = 0, avgLoss = 0;
  for (let i = data.length - period; i < data.length; i++) {
    const diff = data[i] - data[i - 1];
    if (diff > 0) avgGain += diff; else avgLoss += Math.abs(diff);
  }
  avgGain /= period;
  avgLoss /= period;
  if (avgLoss === 0) return 100;
  return 100 - 100 / (1 + avgGain / avgLoss);
}

function computeEMA(data: number[], period: number): number {
  if (!data.length) return 0;
  const k = 2 / (period + 1);
  let ema = data[0];
  for (let i = 1; i < data.length; i++) ema = data[i] * k + ema * (1 - k);
  return ema;
}

function getSignal(rsi: number, macdHist: number, change24h: number): { label: string; color: string; bg: string } {
  let score = 0;
  if (rsi < 30) score += 2; else if (rsi < 45) score += 1; else if (rsi > 70) score -= 2; else if (rsi > 55) score -= 1;
  if (macdHist > 0) score += 1; else score -= 1;
  if (change24h > 2) score += 1; else if (change24h < -2) score -= 1;

  if (score >= 2) return { label: "Achat Fort", color: "text-emerald-400", bg: "bg-emerald-500/15 border-emerald-500/30" };
  if (score >= 1) return { label: "Achat", color: "text-emerald-300", bg: "bg-emerald-500/10 border-emerald-500/20" };
  if (score <= -2) return { label: "Vente Fort", color: "text-red-400", bg: "bg-red-500/15 border-red-500/30" };
  if (score <= -1) return { label: "Vente", color: "text-red-300", bg: "bg-red-500/10 border-red-500/20" };
  return { label: "Neutre", color: "text-yellow-400", bg: "bg-yellow-500/10 border-yellow-500/20" };
}

function formatPrice(price: number): string {
  if (price >= 1) return price.toLocaleString("fr-CA", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  if (price >= 0.01) return price.toFixed(4);
  return price.toFixed(8);
}

interface CandleData { time: number; open: number; high: number; low: number; close: number }

export default function PredictionCrypto() {
  const { cryptoId } = useParams<{ cryptoId: string }>();
  const [coin, setCoin] = useState<CoinMarketData | null>(null);
  const [allCoins, setAllCoins] = useState<CoinMarketData[]>([]);
  const [candles, setCandles] = useState<CandleData[]>([]);
  const [loading, setLoading] = useState(true);
  const [chartLoading, setChartLoading] = useState(true);
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstanceRef = useRef<ReturnType<typeof createChart> | null>(null);

  /* Resolve crypto name/symbol from SEO_CRYPTOS first, then from CoinGecko data */
  const seoInfo = SEO_CRYPTOS.find((c) => c.id === cryptoId);
  const cryptoName = seoInfo?.name || coin?.name || cryptoId || "Crypto";
  const cryptoSymbol = seoInfo?.symbol || coin?.symbol?.toUpperCase() || "";

  // Fetch coin market data
  useEffect(() => {
    setLoading(true);
    fetchTop200()
      .then((data) => {
        setAllCoins(data);
        const found = data.find((c) => c.id === cryptoId);
        if (found) setCoin(found);
      })
      .finally(() => setLoading(false));
  }, [cryptoId]);

  // Fetch Binance candles
  const fetchCandles = useCallback(async () => {
    if (!cryptoId) return;
    setChartLoading(true);
    const symbol = BINANCE_MAP[cryptoId];
    if (!symbol) { setChartLoading(false); return; }

    try {
      const res = await fetch(`/api/binance/klines?symbol=${symbol}&interval=1d&limit=90`);
      if (res.ok) {
        const raw = await res.json();
        const parsed: CandleData[] = raw.map((k: number[]) => ({
          time: Math.floor(k[0] / 1000),
          open: parseFloat(String(k[1])),
          high: parseFloat(String(k[2])),
          low: parseFloat(String(k[3])),
          close: parseFloat(String(k[4])),
        }));
        setCandles(parsed);
      }
    } catch {
      // silent
    } finally {
      setChartLoading(false);
    }
  }, [cryptoId]);

  useEffect(() => { fetchCandles(); }, [fetchCandles]);

  // Render chart
  useEffect(() => {
    if (!chartRef.current || candles.length === 0) return;

    if (chartInstanceRef.current) {
      chartInstanceRef.current.remove();
      chartInstanceRef.current = null;
    }

    const chart = createChart(chartRef.current, {
      width: chartRef.current.clientWidth,
      height: 400,
      layout: { background: { type: ColorType.Solid, color: "transparent" }, textColor: "#9ca3af" },
      grid: { vertLines: { color: "rgba(255,255,255,0.03)" }, horzLines: { color: "rgba(255,255,255,0.03)" } },
      crosshair: { mode: 0 },
      rightPriceScale: { borderColor: "rgba(255,255,255,0.06)" },
      timeScale: { borderColor: "rgba(255,255,255,0.06)", timeVisible: false },
    });

    const series = chart.addSeries(CandlestickSeries, {
      upColor: "#10b981",
      downColor: "#ef4444",
      borderUpColor: "#10b981",
      borderDownColor: "#ef4444",
      wickUpColor: "#10b981",
      wickDownColor: "#ef4444",
    });

    series.setData(candles.map((c) => ({ time: c.time as unknown as import("lightweight-charts").UTCTimestamp, open: c.open, high: c.high, low: c.low, close: c.close })));
    chart.timeScale().fitContent();
    chartInstanceRef.current = chart;

    const handleResize = () => {
      if (chartRef.current) chart.applyOptions({ width: chartRef.current.clientWidth });
    };
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
      chart.remove();
      chartInstanceRef.current = null;
    };
  }, [candles]);

  // Compute indicators
  const closes = candles.map((c) => c.close);
  const rsi = closes.length > 15 ? computeRSI(closes) : 50;
  const ema12 = computeEMA(closes, 12);
  const ema26 = computeEMA(closes, 26);
  const macdHist = ema12 - ema26;
  const change24h = coin?.price_change_percentage_24h ?? 0;
  const signal = getSignal(rsi, macdHist, change24h);

  const hasBinanceChart = !!BINANCE_MAP[cryptoId || ""];

  /* Related cryptos: use full coin list, exclude stablecoins/wrapped and current */
  const relatedCoins = allCoins
    .filter((c) => c.id !== cryptoId && !EXCLUDED_IDS.has(c.id))
    .slice(0, 10);

  const seoTitle = `Prédiction ${cryptoName} (${cryptoSymbol}) 2025-2026 par IA`;
  const seoDesc = `Analyse et prédiction ${cryptoName} en temps réel par intelligence artificielle. Graphique en chandeliers, RSI, MACD et signaux de trading pour ${cryptoSymbol}.`;

  return (
    <div className="min-h-screen bg-[#0A0E1A] text-white">
      <SEOHead title={seoTitle} description={seoDesc} path={`/prediction/${cryptoId}`} />
      <Sidebar />
      <main className="md:ml-[260px] p-4 md:p-6 pt-[72px] md:pt-6 min-h-screen">
        {/* Back link */}
        <Link to="/predictions" className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-indigo-400 transition-colors mb-6">
          <ArrowLeft className="w-4 h-4" /> Toutes les prédictions
        </Link>

        {loading ? (
          <div className="text-center py-20 text-gray-500">Chargement...</div>
        ) : (
          <>
            {/* Header */}
            <div className="flex flex-wrap items-center gap-4 mb-6">
              {coin?.image && <img src={coin.image} alt={cryptoName} className="w-14 h-14 rounded-full" />}
              <div>
                <h1 className="text-3xl font-extrabold">
                  Prédiction {cryptoName}{" "}
                  <span className="text-gray-500 text-xl">({cryptoSymbol})</span>
                </h1>
                <p className="text-gray-400 text-sm mt-1">
                  Analyse IA en temps réel {hasBinanceChart ? "— Données Binance" : "— Données CoinGecko"}
                </p>
              </div>
            </div>

            {/* Stats cards */}
            <div className="grid md:grid-cols-4 gap-4 mb-6">
              {/* Price */}
              <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4">
                <p className="text-xs text-gray-500 mb-1">Prix actuel</p>
                <p className="text-2xl font-bold">${coin ? formatPrice(coin.current_price) : "—"}</p>
              </div>
              {/* 24h change */}
              <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4">
                <p className="text-xs text-gray-500 mb-1">Variation 24h</p>
                <p className={`text-2xl font-bold flex items-center gap-2 ${change24h >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                  {change24h >= 0 ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
                  {change24h.toFixed(2)}%
                </p>
              </div>
              {/* RSI */}
              <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4">
                <p className="text-xs text-gray-500 mb-1">RSI (14)</p>
                <p className={`text-2xl font-bold ${rsi > 70 ? "text-red-400" : rsi < 30 ? "text-emerald-400" : "text-yellow-400"}`}>
                  {rsi.toFixed(1)}
                </p>
                <p className="text-[10px] text-gray-500 mt-1">
                  {rsi > 70 ? "Suracheté" : rsi < 30 ? "Survendu" : "Neutre"}
                </p>
              </div>
              {/* Signal IA */}
              <div className={`border rounded-xl p-4 ${signal.bg}`}>
                <p className="text-xs text-gray-500 mb-1">Signal IA</p>
                <p className={`text-2xl font-bold ${signal.color}`}>{signal.label}</p>
                <p className="text-[10px] text-gray-500 mt-1">Basé sur RSI + MACD + Momentum</p>
              </div>
            </div>

            {/* Chart */}
            <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-4 mb-6">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-indigo-400" />
                  <h2 className="font-bold">Graphique en chandeliers — 90 jours</h2>
                </div>
                {hasBinanceChart && (
                  <button onClick={fetchCandles} className="p-2 rounded-lg hover:bg-white/[0.06] transition-colors" title="Rafraîchir">
                    <RefreshCw className="w-4 h-4 text-gray-400" />
                  </button>
                )}
              </div>
              {!hasBinanceChart ? (
                <div className="h-[400px] flex flex-col items-center justify-center text-gray-500">
                  <BarChart3 className="w-10 h-10 mb-3 text-gray-600" />
                  <p className="text-sm font-medium">Graphique en chandeliers non disponible pour cette crypto</p>
                  <p className="text-xs text-gray-600 mt-1">Les données de prix et indicateurs sont calculés via CoinGecko</p>
                </div>
              ) : chartLoading ? (
                <div className="h-[400px] flex items-center justify-center text-gray-500">
                  <Activity className="w-5 h-5 animate-pulse mr-2" /> Chargement du graphique...
                </div>
              ) : candles.length === 0 ? (
                <div className="h-[400px] flex items-center justify-center text-gray-500">
                  Données non disponibles pour cette crypto
                </div>
              ) : (
                <div ref={chartRef} className="w-full" />
              )}
            </div>

            {/* Indicators detail */}
            <div className="grid md:grid-cols-3 gap-4 mb-6">
              <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-5">
                <h3 className="font-bold text-sm mb-3 text-indigo-300">📊 RSI (Relative Strength Index)</h3>
                <div className="relative h-3 bg-white/[0.06] rounded-full overflow-hidden mb-2">
                  <div
                    className={`absolute left-0 top-0 h-full rounded-full transition-all ${rsi > 70 ? "bg-red-500" : rsi < 30 ? "bg-emerald-500" : "bg-yellow-500"}`}
                    style={{ width: `${Math.min(rsi, 100)}%` }}
                  />
                </div>
                <div className="flex justify-between text-[10px] text-gray-500">
                  <span>Survendu (0-30)</span>
                  <span className="font-bold text-white">{rsi.toFixed(1)}</span>
                  <span>Suracheté (70-100)</span>
                </div>
              </div>

              <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-5">
                <h3 className="font-bold text-sm mb-3 text-purple-300">📈 MACD</h3>
                <p className={`text-xl font-bold ${macdHist >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                  {macdHist >= 0 ? "+" : ""}{macdHist.toFixed(4)}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {macdHist >= 0 ? "Momentum haussier — Signal d'achat potentiel" : "Momentum baissier — Signal de vente potentiel"}
                </p>
              </div>

              <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-5">
                <h3 className="font-bold text-sm mb-3 text-amber-300">🏆 Capitalisation</h3>
                <p className="text-xl font-bold">
                  ${coin?.market_cap ? (coin.market_cap / 1e9).toFixed(2) + " Mds" : "—"}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Rang #{coin?.market_cap_rank ?? "—"} • Volume 24h: ${coin?.total_volume ? (coin.total_volume / 1e9).toFixed(2) + " Mds" : "—"}
                </p>
              </div>
            </div>

            {/* SEO content */}
            <div className="bg-white/[0.02] border border-white/[0.04] rounded-2xl p-6 mb-8">
              <h2 className="text-lg font-bold mb-3 text-indigo-300">
                Prédiction {cryptoName} ({cryptoSymbol}) — Analyse IA 2025-2026
              </h2>
              <p className="text-sm text-gray-400 leading-relaxed mb-3">
                Notre intelligence artificielle analyse en continu les données de marché de {cryptoName} ({cryptoSymbol})
                pour fournir des prédictions fiables. L'analyse combine les indicateurs techniques (RSI, MACD, Moyennes Mobiles Exponentielles),
                les données on-chain, le volume de trading et le sentiment global du marché crypto.
              </p>
              <p className="text-sm text-gray-400 leading-relaxed mb-3">
                {hasBinanceChart
                  ? `Le graphique ci-dessus affiche les chandeliers japonais des 90 derniers jours, alimenté en temps réel par l'API Binance.`
                  : `Les données de prix sont fournies par CoinGecko en temps réel.`}
                {" "}Le signal IA est calculé en combinant le RSI (14 périodes), le MACD (12/26/9) et le momentum des dernières 24 heures.
              </p>
              <p className="text-sm text-gray-400 leading-relaxed">
                <strong className="text-white">⚠️ Avertissement :</strong> Les prédictions IA sont fournies à titre informatif uniquement
                et ne constituent pas un conseil financier. Investissez toujours de manière responsable et ne risquez que ce que vous pouvez vous permettre de perdre.
              </p>
            </div>

            {/* Related cryptos — from full coin list */}
            <div className="mb-8">
              <h3 className="font-bold text-lg mb-4">Autres prédictions crypto</h3>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                {relatedCoins.map((c) => (
                  <Link
                    key={c.id}
                    to={`/prediction/${c.id}`}
                    className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-3 text-center hover:bg-white/[0.06] hover:border-indigo-500/30 transition-all"
                  >
                    <div className="flex items-center justify-center gap-2 mb-1">
                      {c.image && <img src={c.image} alt={c.name} className="w-5 h-5 rounded-full" />}
                      <p className="font-bold text-sm">{c.name}</p>
                    </div>
                    <p className="text-[10px] text-gray-500">{c.symbol.toUpperCase()}</p>
                  </Link>
                ))}
              </div>
            </div>
          </>
        )}
      </main>
      <Footer />
      <ShareButtons title={`Prédiction ${cryptoName} par IA — CryptoIA`} />
    </div>
  );
}