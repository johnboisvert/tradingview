import { useEffect, useState, useCallback } from "react";
import Sidebar from "@/components/Sidebar";
import { Newspaper, RefreshCw, ExternalLink, Clock, AlertTriangle, Wifi, WifiOff } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import Footer from "@/components/Footer";

const NEWS_BG =
  "https://mgx-backend-cdn.metadl.com/generate/images/966405/2026-02-18/6e7996e5-3fd7-4958-9f83-5d5f09ef989f.png";

interface NewsItem {
  id: string;
  title: string;
  url: string;
  source: string;
  publishedAt: string;
  currencies: string[];
  kind: string;
}

export default function News() {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState("");
  const [dataSource, setDataSource] = useState<"live" | "fallback" | "none">("none");
  const [errorMsg, setErrorMsg] = useState("");

  const fetchNews = useCallback(async () => {
    setLoading(true);
    setErrorMsg("");

    // Strategy 1: Try our local proxy (avoids CORS)
    try {
      const res = await fetch("/api/news", { signal: AbortSignal.timeout(15000) });
      if (res.ok) {
        const contentType = res.headers.get("content-type") || "";
        if (contentType.includes("application/json")) {
          const data = await res.json();
          if (data?.results && Array.isArray(data.results) && data.results.length > 0) {
            setNews(
              data.results.slice(0, 50).map((item: Record<string, unknown>, i: number) => ({
                id: String(item.id || i),
                title: (item.title as string) || "",
                url: (item.url as string) || "#",
                source: ((item.source as Record<string, unknown>)?.title as string) || "Crypto News",
                publishedAt: (item.published_at as string) || new Date().toISOString(),
                currencies: ((item.currencies as Array<Record<string, unknown>>) || []).map((c) => (c.code as string) || ""),
                kind: (item.kind as string) || "news",
              }))
            );
            setDataSource("live");
            setLastUpdate(new Date().toLocaleTimeString("fr-FR"));
            setLoading(false);
            return;
          }
        }
        // If content-type is not JSON (e.g. Cloudflare HTML), skip to fallback
      }
    } catch {
      // Proxy failed, try alternative
    }

    // Strategy 2: Try CoinGecko status updates as alternative real news source
    try {
      const res = await fetch(
        "/api/coingecko/search/trending",
        { signal: AbortSignal.timeout(10000) }
      );
      if (res.ok) {
        const data = await res.json();
        const trendingCoins = data?.coins || [];
        if (trendingCoins.length > 0) {
          // Build news items from trending coins data
          const trendingNews: NewsItem[] = trendingCoins.slice(0, 15).map(
            (item: { item: { id: string; name: string; symbol: string; market_cap_rank: number; score: number } }, i: number) => ({
              id: `trending-${i}`,
              title: `🔥 ${item.item.name} (${item.item.symbol.toUpperCase()}) est en tendance — Rang #${item.item.market_cap_rank || "N/A"} par capitalisation`,
              url: `https://www.coingecko.com/en/coins/${item.item.id}`,
              source: "CoinGecko Trending",
              publishedAt: new Date(Date.now() - i * 1800000).toISOString(),
              currencies: [item.item.symbol.toUpperCase()],
              kind: "trending",
            })
          );
          setNews(trendingNews);
          setDataSource("fallback");
          setLastUpdate(new Date().toLocaleTimeString("fr-FR"));
          setLoading(false);
          return;
        }
      }
    } catch {
      // CoinGecko also failed
    }

    // Strategy 3: All sources failed
    setDataSource("none");
    setErrorMsg(
      "Impossible de charger les actualités en temps réel. Les sources d'actualités (CryptoPanic, CoinGecko) sont temporairement indisponibles. Veuillez réessayer dans quelques instants."
    );
    setLastUpdate(new Date().toLocaleTimeString("fr-FR"));
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchNews();
    const interval = setInterval(fetchNews, 300000); // Refresh every 5 minutes
    return () => clearInterval(interval);
  }, [fetchNews]);

  function timeAgo(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `il y a ${mins}m`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `il y a ${hours}h`;
    return `il y a ${Math.floor(hours / 24)}j`;
  }

  return (
    <div className="min-h-screen bg-[#0A0E1A] text-white">
      <Sidebar />
      <main className="md:ml-[260px] pt-14 md:pt-0 bg-[#0A0E1A]">
      <PageHeader
          icon={<Newspaper className="w-6 h-6" />}
          title="Actualités Crypto"
          subtitle="Restez informé des dernières nouvelles du marché crypto en temps réel. Articles provenant de sources vérifiées et fiables."
          accentColor="blue"
          steps={[
            { n: "1", title: "Lisez les dernières news", desc: "Les actualités sont récupérées en temps réel depuis CryptoPanic et CoinGecko, des sources fiables du marché crypto." },
            { n: "2", title: "Vérifiez la source", desc: "Chaque article indique sa source d'origine. Cliquez pour lire l'article complet sur le site source." },
            { n: "3", title: "Réagissez rapidement", desc: "Les grandes news peuvent créer des opportunités de trading. Croisez toujours l'info avec l'analyse technique avant d'agir." },
          ]}
        />
        {/* Hero */}
        <div className="relative rounded-2xl overflow-hidden mb-6 h-[140px]">
          <img src={NEWS_BG} alt="" className="absolute inset-0 w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0A0E1A]/95 via-[#0A0E1A]/75 to-transparent" />
          <div className="relative z-10 h-full flex items-center justify-between px-8">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <Newspaper className="w-7 h-7 text-blue-400" />
                <h1 className="text-2xl font-extrabold">Actualités Crypto</h1>
                {dataSource === "live" && (
                  <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold border border-emerald-500/30">
                    <Wifi className="w-3 h-3" />
                    EN DIRECT
                  </span>
                )}
                {dataSource === "fallback" && (
                  <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400 text-xs font-bold border border-amber-500/30">
                    <AlertTriangle className="w-3 h-3" />
                    TENDANCES
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-400">
                {dataSource === "live"
                  ? "Dernières nouvelles du marché crypto • Source: CryptoPanic"
                  : dataSource === "fallback"
                  ? "Cryptos en tendance • Source: CoinGecko Trending"
                  : "Chargement des actualités..."}
              </p>
            </div>
            <button onClick={fetchNews} disabled={loading}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/[0.08] hover:bg-white/[0.12] border border-white/[0.08] text-sm font-semibold transition-all">
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
              {lastUpdate ? `MAJ ${lastUpdate}` : "Rafraîchir"}
            </button>
          </div>
        </div>

        {/* Data source info banner */}
        {dataSource === "fallback" && (
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 mb-6 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-bold text-amber-400 mb-1">Source alternative active</p>
              <p className="text-xs text-gray-400">
                Les actualités CryptoPanic sont temporairement indisponibles. Nous affichons les cryptos en tendance depuis CoinGecko.
                Les données sont réelles et à jour. Cliquez sur un article pour voir les détails sur CoinGecko.
              </p>
            </div>
          </div>
        )}

        {/* Error state */}
        {dataSource === "none" && !loading && errorMsg && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-6 mb-6 flex items-start gap-3">
            <WifiOff className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-bold text-red-400 mb-1">Actualités indisponibles</p>
              <p className="text-xs text-gray-400">{errorMsg}</p>
              <button
                onClick={fetchNews}
                className="mt-3 px-4 py-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-400 text-xs font-bold transition-all"
              >
                🔄 Réessayer
              </button>
            </div>
          </div>
        )}

        {/* KPIs */}
        {news.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <div className="bg-[#111827] border border-white/[0.06] rounded-2xl p-5">
              <p className="text-xs text-gray-500 font-semibold mb-1">Articles</p>
              <p className="text-2xl font-extrabold">{news.length}</p>
            </div>
            <div className="bg-[#111827] border border-white/[0.06] rounded-2xl p-5">
              <p className="text-xs text-gray-500 font-semibold mb-1">Sources</p>
              <p className="text-2xl font-extrabold text-blue-400">{new Set(news.map((n) => n.source)).size}</p>
            </div>
            <div className="bg-[#111827] border border-white/[0.06] rounded-2xl p-5">
              <p className="text-xs text-gray-500 font-semibold mb-1">Cryptos Mentionnées</p>
              <p className="text-2xl font-extrabold text-cyan-400">{new Set(news.flatMap((n) => n.currencies)).size}</p>
            </div>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="bg-[#111827] border border-white/[0.06] rounded-2xl p-16 text-center mb-6">
            <div className="w-12 h-12 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin mx-auto mb-4" />
            <p className="text-sm text-gray-400">Chargement des actualités en temps réel...</p>
          </div>
        )}

        {/* News List */}
        {news.length > 0 && (
          <div className="bg-[#111827] border border-white/[0.06] rounded-2xl p-6">
            <h2 className="text-lg font-bold mb-4">
              {dataSource === "live" ? "📰 Dernières Nouvelles" : "🔥 Cryptos en Tendance"}
            </h2>
            <div className="space-y-3">
              {news.map((item) => (
                <a key={item.id} href={item.url} target="_blank" rel="noopener noreferrer"
                  className="block p-4 bg-black/20 rounded-xl border border-white/[0.04] hover:border-white/[0.1] hover:bg-white/[0.02] transition-all group">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <h3 className="text-sm font-bold group-hover:text-indigo-400 transition-colors leading-snug">{item.title}</h3>
                      <div className="flex items-center gap-3 mt-2 flex-wrap">
                        <span className="text-xs text-gray-500 font-semibold">{item.source}</span>
                        <div className="flex items-center gap-1 text-xs text-gray-600">
                          <Clock className="w-3 h-3" />
                          {timeAgo(item.publishedAt)}
                        </div>
                        {item.currencies.length > 0 && (
                          <div className="flex gap-1">
                            {item.currencies.slice(0, 4).map((c, i) => (
                              <span key={i} className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-indigo-500/20 text-indigo-400">{c}</span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    <ExternalLink className="w-4 h-4 text-gray-600 group-hover:text-indigo-400 flex-shrink-0 mt-1" />
                  </div>
                </a>
              ))}
            </div>
          </div>
        )}
        <Footer />
      </main>
    </div>
  );
}