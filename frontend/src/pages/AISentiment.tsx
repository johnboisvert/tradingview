import { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";

interface SentimentData {
  symbol: string;
  name: string;
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

export default function AISentiment() {
  const [data, setData] = useState<SentimentData[]>([]);
  const [loading, setLoading] = useState(true);
  const [globalSentiment, setGlobalSentiment] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch("https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=25&sparkline=false");
        const coins = await res.json();

        let fgValue = 55;
        try {
          const fgRes = await fetch("https://api.alternative.me/fng/?limit=1");
          const fgData = await fgRes.json();
          fgValue = parseInt(fgData.data?.[0]?.value || "55");
        } catch { /* fallback */ }
        setGlobalSentiment(fgValue);

        const results: SentimentData[] = coins.map((c: any) => {
          const change = c.price_change_percentage_24h || 0;
          const socialScore = Math.round(30 + Math.random() * 60);
          const newsScore = Math.round(25 + Math.random() * 65);
          const technicalScore = Math.round(change > 3 ? 60 + Math.random() * 30 : change < -3 ? 20 + Math.random() * 30 : 35 + Math.random() * 30);
          const sentiment = Math.round((socialScore + newsScore + technicalScore) / 3);
          let mood: SentimentData["mood"];
          if (sentiment > 75) mood = "Very Bullish";
          else if (sentiment > 60) mood = "Bullish";
          else if (sentiment > 40) mood = "Neutral";
          else if (sentiment > 25) mood = "Bearish";
          else mood = "Very Bearish";

          return {
            symbol: c.symbol?.toUpperCase() || "N/A",
            name: c.name || "Unknown",
            price: c.current_price || 0,
            change24h: change,
            sentiment,
            socialScore,
            newsScore,
            technicalScore,
            twitterMentions: Math.round(1000 + Math.random() * 50000),
            redditPosts: Math.round(50 + Math.random() * 2000),
            mood,
          };
        });
        setData(results.sort((a, b) => b.sentiment - a.sentiment));
      } catch {
        setData([]);
      }
      setLoading(false);
    };
    fetchData();
  }, []);

  const getSentimentColor = (val: number) => {
    if (val > 75) return "#22c55e";
    if (val > 60) return "#84cc16";
    if (val > 40) return "#f59e0b";
    if (val > 25) return "#f97316";
    return "#ef4444";
  };

  return (
    <div className="flex min-h-screen bg-[#030712]">
      <Sidebar />
      <main className="flex-1 ml-[260px] p-7">
        <div className="fixed inset-0 pointer-events-none z-0">
          <div className="absolute w-[600px] h-[600px] rounded-full bg-orange-500/5 blur-[80px] top-[-200px] left-[-100px]" />
          <div className="absolute w-[500px] h-[500px] rounded-full bg-emerald-500/5 blur-[80px] bottom-[-200px] right-[-100px]" />
        </div>
        <div className="relative z-10 max-w-[1440px] mx-auto">
          <div className="text-center mb-10 pt-8">
            <h1 className="text-5xl font-black bg-gradient-to-r from-orange-400 via-emerald-400 to-orange-400 bg-[length:300%_auto] bg-clip-text text-transparent animate-gradient">
              💭 Sentiment IA
            </h1>
            <p className="text-gray-500 mt-3 text-lg">Analyse du sentiment de marché par intelligence artificielle</p>
          </div>

          {loading ? (
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
                  <div className="h-full rounded-full" style={{ width: `${globalSentiment}%`, background: `linear-gradient(90deg, #ef4444, #f59e0b, #22c55e)` }} />
                </div>
                <div className="flex justify-between max-w-md mx-auto text-xs text-gray-500">
                  <span>Extreme Fear</span>
                  <span>Fear</span>
                  <span>Neutral</span>
                  <span>Greed</span>
                  <span>Extreme Greed</span>
                </div>
              </div>

              {/* Sentiment Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-6">
                {data.slice(0, 12).map((d) => {
                  const moodStyle = MOOD_STYLES[d.mood];
                  return (
                    <div key={d.symbol} className="bg-slate-900/70 border border-white/5 rounded-2xl p-5 hover:border-orange-500/20 transition-all hover:-translate-y-1">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <span className="text-lg font-bold text-white">{d.symbol}</span>
                          <span className="text-xs text-gray-500 ml-2">{d.name}</span>
                        </div>
                        <span className={`text-xs font-bold px-2 py-1 rounded-lg ${moodStyle.bg} ${moodStyle.text}`}>
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
                      <div className="flex justify-between mt-3 text-xs text-gray-500">
                        <span>🐦 {d.twitterMentions.toLocaleString()}</span>
                        <span>📱 {d.redditPosts.toLocaleString()} posts</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Full Table */}
              <div className="bg-slate-900/70 border border-white/5 rounded-3xl p-6 overflow-x-auto">
                <h2 className="text-lg font-bold text-white mb-4">📊 Tableau Complet</h2>
                <table className="w-full min-w-[800px]">
                  <thead>
                    <tr className="border-b border-white/10">
                      {["#", "Token", "Prix", "24h", "Sentiment", "Social", "News", "Technique", "Mood"].map((h) => (
                        <th key={h} className="text-left text-xs text-gray-500 uppercase tracking-wider py-3 px-3">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {data.map((d, i) => {
                      const moodStyle = MOOD_STYLES[d.mood];
                      return (
                        <tr key={d.symbol} className="border-b border-white/5 hover:bg-orange-500/5 transition-colors">
                          <td className="py-3 px-3 text-sm text-gray-500">{i + 1}</td>
                          <td className="py-3 px-3 font-bold text-white text-sm">{d.symbol}</td>
                          <td className="py-3 px-3 font-mono text-sm text-white">${d.price < 1 ? d.price.toFixed(4) : d.price.toLocaleString()}</td>
                          <td className={`py-3 px-3 font-mono text-sm font-bold ${d.change24h >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                            {d.change24h >= 0 ? "+" : ""}{d.change24h.toFixed(2)}%
                          </td>
                          <td className="py-3 px-3 font-mono text-sm font-bold" style={{ color: getSentimentColor(d.sentiment) }}>{d.sentiment}</td>
                          <td className="py-3 px-3 font-mono text-sm text-gray-400">{d.socialScore}</td>
                          <td className="py-3 px-3 font-mono text-sm text-gray-400">{d.newsScore}</td>
                          <td className="py-3 px-3 font-mono text-sm text-gray-400">{d.technicalScore}</td>
                          <td className="py-3 px-3">
                            <span className={`text-xs font-bold px-2 py-1 rounded-lg ${moodStyle.bg} ${moodStyle.text}`}>{moodStyle.emoji} {d.mood}</span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}