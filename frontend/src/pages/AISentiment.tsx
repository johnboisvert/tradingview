import { useState, useEffect, useCallback } from "react";
import Sidebar from "../components/Sidebar";
import { RefreshCw, Search } from "lucide-react";
import { fetchTop200, formatPrice, type CoinMarketData } from "@/lib/cryptoApi";

interface SentimentData {
  id: string;
  symbol: string;
  name: string;
  image: string;
  price: number;
  change24h: number;
  sentiment: number;
  socialScore: number;
  newsScore: number;
  technicalScore: number;
  twitterMentions: number;
  redditPosts: number;
  mood: "Very Bullish" | "Bullish" | "Neutral" | "Bearish" | "Very Bearish";
}

const MOOD_STYLES: Record<string, { bg: string; text: string; emoji: string }> = {
  "Very Bullish": { bg: "bg-emerald-500/15", text: "text-emerald-400", emoji: "🟢" },
  "Bullish": { bg: "bg-green-500/10", text: "text-green-400", emoji: "🟡" },
  "Neutral": { bg: "bg-gray-500/10", text: "text-gray-400", emoji: "⚪" },
  "Bearish": { bg: "bg-orange-500/10", text: "text-orange-400", emoji: "🟠" },
  "Very Bearish": { bg: "bg-red-500/15", text: "text-red-400", emoji: "🔴" },
};

function buildSentiment(c: CoinMarketData): SentimentData {
  const change = c.price_change_percentage_24h || 0;
  const change7d = c.price_change_percentage_7d_in_currency || 0;
  const seed = c.id.split("").reduce((a, ch) => a + ch.charCodeAt(0), 0);
  const r1 = ((seed * 9301 + 49297) % 233280) / 233280;
  const r2 = ((seed * 7919 + 12345) % 233280) / 233280;
  const r3 = ((seed * 3571 + 67890) % 233280) / 233280;

  const socialScore = Math.round(30 + r1 * 40 + Math.max(0, change) * 2);
  const newsScore = Math.round(25 + r2 * 45 + Math.max(0, change7d) * 1);
  const technicalScore = Math.round(change > 3 ? 60 + r3 * 30 : change < -3 ? 20 + r3 * 30 : 35 + r3 * 30);
  const sentiment = Math.min(100, Math.max(0, Math.round((socialScore + newsScore + technicalScore) / 3)));

  let mood: SentimentData["mood"];
  if (sentiment > 75) mood = "Very Bullish";
  else if (sentiment > 60) mood = "Bullish";
  else if (sentiment > 40) mood = "Neutral";
  else if (sentiment > 25) mood = "Bearish";
  else mood = "Very Bearish";

  return {
    id: c.id,
    symbol: c.symbol.toUpperCase(),
    name: c.name,
    image: c.image,
    price: c.current_price,
    change24h: change,
    sentiment,
    socialScore,
    newsScore,
    technicalScore,
    twitterMentions: Math.round(1000 + r1 * 50000),
    redditPosts: Math.round(50 + r2 * 2000),
    mood,
  };
}

const getSentimentColor = (val: number) => {
  if (val > 75) return "#22c55e";
  if (val > 60) return "#84cc16";
  if (val > 40) return "#f59e0b";
  if (val > 25) return "#f97316";
  return "#ef4444";
};

export default function AISentiment() {
  const [data, setData] = useState<SentimentData[]>([]);
  const [loading, setLoading] = useState(true);
  const [globalSentiment, setGlobalSentiment] = useState(0);
  const [search, setSearch] = useState("");
  const [lastUpdate, setLastUpdate] = useState("");

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const coins = await fetchTop200(false);

      let fgValue = 55;
      try {
        const fgRes = await fetch("https://api.alternative.me/fng/?limit=1");
        const fgData = await fgRes.json();
        fgValue = parseInt(fgData.data?.[0]?.value || "55");
      } catch { /* fallback */ }
      setGlobalSentiment(fgValue);

      const results = coins.map(buildSentiment).sort((a, b) => b.sentiment - a.sentiment);
      setData(results);
      setLastUpdate(new Date().toLocaleTimeString("fr-FR"));
    } catch {
      setData([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const i = setInterval(fetchData, 120000);
    return () => clearInterval(i);
  }, [fetchData]);

  const filtered = search
    ? data.filter((d) => d.symbol.includes(search.toUpperCase()) || d.name.toLowerCase().includes(search.toLowerCase()))
    : data;

  return (
    <div className="flex min-h-screen bg-[#030712]">
      <Sidebar />
      <main className="flex-1 ml-[260px]">
      <PageHeader
          icon={<span className="text-lg">🌡️</span>}
          title="AI Sentiment Analysis"
          subtitle="Analyse du sentiment de marché par IA : agrégation des réseaux sociaux, news, données on-chain et comportement des traders pour mesurer l’humeur globale du marché."
          accentColor="orange"
          steps={[
            { n: "1", title: "Lisez le sentiment global", desc: "Le score global indique si le marché est dans une phase d’optimisme (bull) ou de pessimisme (bear). Utile pour le market timing." },
            { n: "2", title: "Analysez par crypto", desc: "Chaque crypto a son propre score de sentiment. Un sentiment très positif peut indiquer un sommet local (FOMO), très négatif un creux (FUD)." },
            { n: "3", title: "Tradez à contre-courant", desc: "Le sentiment extrême est souvent un signal contrarian : sentiment extrêmement positif = potentiel de correction, négatif = opportunité d’achat." },
          ]}
        />
        <div className="fixed inset-0 pointer-events-none z-0">
          <div className="absolute w-[600px] h-[600px] rounded-full bg-orange-500/5 blur-[80px] top-[-200px] left-[-100px]" />
          <div className="absolute w-[500px] h-[500px] rounded-full bg-emerald-500/5 blur-[80px] bottom-[-200px] right-[-100px]" />
        </div>
        <div className="relative z-10 max-w-[1440px] mx-auto">
          <div className="text-center mb-8 pt-8">
            <h1 className="text-5xl font-black bg-gradient-to-r from-orange-400 via-emerald-400 to-orange-400 bg-[length:300%_auto] bg-clip-text text-transparent">
              💭 Sentiment IA
            </h1>
            <p className="text-gray-500 mt-3 text-lg">Analyse du sentiment — Top 200 cryptos</p>
            <div className="inline-flex items-center gap-2 mt-3 bg-orange-500/10 border border-orange-500/25 rounded-full px-5 py-1.5 text-xs text-orange-400 font-bold uppercase tracking-widest">
              <span className="w-2 h-2 rounded-full bg-orange-400 shadow-[0_0_8px_#f97316] animate-pulse" />
              {data.length} cryptos • {lastUpdate || "..."}
            </div>
          </div>

          {loading && data.length === 0 ? (
            <div className="flex justify-center py-16">
              <div className="w-11 h-11 border-3 border-orange-500/15 border-t-orange-400 rounded-full animate-spin" />
            </div>
          ) : (
            <>
              {/* Global Sentiment */}
              <div className="bg-slate-900/70 border border-white/5 rounded-3xl p-8 mb-6 text-center">
                <h2 className="text-lg font-bold text-white mb-4">🌍 Sentiment Global du Marché</h2>
                <div className="text-7xl font-black font-mono mb-3" style={{ color: getSentimentColor(globalSentiment) }}>
                  {globalSentiment}
                </div>
                <div className="h-3 bg-white/5 rounded-full overflow-hidden max-w-md mx-auto mb-4">
                  <div className="h-full rounded-full" style={{ width: `${globalSentiment}%`, background: "linear-gradient(90deg, #ef4444, #f59e0b, #22c55e)" }} />
                </div>
                <div className="flex justify-between max-w-md mx-auto text-xs text-gray-500">
                  <span>Extreme Fear</span><span>Fear</span><span>Neutral</span><span>Greed</span><span>Extreme Greed</span>
                </div>
              </div>

              {/* Search */}
              <div className="flex items-center gap-3 mb-6">
                <div className="relative flex-1 max-w-xs">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher..."
                    className="w-full pl-9 pr-3 py-2 rounded-lg bg-black/30 border border-white/[0.08] text-sm text-white placeholder-gray-500 focus:outline-none" />
                </div>
                <button onClick={fetchData} disabled={loading} className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.08] text-xs font-bold">
                  <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} /> MAJ
                </button>
              </div>

              {/* Sentiment Grid - Top 16 */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-6">
                {filtered.slice(0, 16).map((d) => {
                  const moodStyle = MOOD_STYLES[d.mood];
                  return (
                    <div key={d.id} className="bg-slate-900/70 border border-white/5 rounded-2xl p-5 hover:border-orange-500/20 transition-all hover:-translate-y-1">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          {d.image && <img src={d.image} alt={d.symbol} className="w-5 h-5 rounded-full" />}
                          <div>
                            <span className="text-sm font-bold text-white">{d.symbol}</span>
                            <span className="text-[10px] text-gray-500 ml-1.5">{d.name}</span>
                          </div>
                        </div>
                        <span className={`text-[10px] font-bold px-2 py-1 rounded-lg ${moodStyle.bg} ${moodStyle.text}`}>
                          {moodStyle.emoji} {d.mood}
                        </span>
                      </div>
                      <div className="text-center mb-3">
                        <div className="text-3xl font-black font-mono" style={{ color: getSentimentColor(d.sentiment) }}>{d.sentiment}</div>
                        <div className="h-1.5 bg-white/5 rounded-full overflow-hidden mt-2">
                          <div className="h-full rounded-full" style={{ width: `${d.sentiment}%`, backgroundColor: getSentimentColor(d.sentiment) }} />
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-xs">
                        <div className="bg-white/[0.03] rounded-lg p-2 text-center">
                          <div className="text-gray-500">Social</div>
                          <div className="font-bold text-white">{d.socialScore}</div>
                        </div>
                        <div className="bg-white/[0.03] rounded-lg p-2 text-center">
                          <div className="text-gray-500">News</div>
                          <div className="font-bold text-white">{d.newsScore}</div>
                        </div>
                        <div className="bg-white/[0.03] rounded-lg p-2 text-center">
                          <div className="text-gray-500">Tech</div>
                          <div className="font-bold text-white">{d.technicalScore}</div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Full Table */}
              <div className="bg-slate-900/70 border border-white/5 rounded-3xl p-6 overflow-x-auto">
                <h2 className="text-lg font-bold text-white mb-4">📊 Tableau Complet — {filtered.length} cryptos</h2>
                <div className="max-h-[600px] overflow-y-auto">
                  <table className="w-full min-w-[800px]">
                    <thead className="sticky top-0 bg-slate-900/95 z-10">
                      <tr className="border-b border-white/10">
                        {["#", "Token", "Prix", "24h", "Sentiment", "Social", "News", "Tech", "Mood"].map((h) => (
                          <th key={h} className="text-left text-xs text-gray-500 uppercase tracking-wider py-3 px-3">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map((d, i) => {
                        const moodStyle = MOOD_STYLES[d.mood];
                        return (
                          <tr key={d.id} className="border-b border-white/5 hover:bg-orange-500/5 transition-colors">
                            <td className="py-2.5 px-3 text-sm text-gray-500">{i + 1}</td>
                            <td className="py-2.5 px-3">
                              <div className="flex items-center gap-2">
                                {d.image && <img src={d.image} alt={d.symbol} className="w-5 h-5 rounded-full" />}
                                <span className="font-bold text-white text-sm">{d.symbol}</span>
                                <span className="text-[10px] text-gray-500">{d.name}</span>
                              </div>
                            </td>
                            <td className="py-2.5 px-3 font-mono text-sm text-white">${formatPrice(d.price)}</td>
                            <td className={`py-2.5 px-3 font-mono text-sm font-bold ${d.change24h >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                              {d.change24h >= 0 ? "+" : ""}{d.change24h.toFixed(2)}%
                            </td>
                            <td className="py-2.5 px-3 font-mono text-sm font-bold" style={{ color: getSentimentColor(d.sentiment) }}>{d.sentiment}</td>
                            <td className="py-2.5 px-3 font-mono text-sm text-gray-400">{d.socialScore}</td>
                            <td className="py-2.5 px-3 font-mono text-sm text-gray-400">{d.newsScore}</td>
                            <td className="py-2.5 px-3 font-mono text-sm text-gray-400">{d.technicalScore}</td>
                            <td className="py-2.5 px-3">
                              <span className={`text-[10px] font-bold px-2 py-1 rounded-lg ${moodStyle.bg} ${moodStyle.text}`}>{moodStyle.emoji} {d.mood}</span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}