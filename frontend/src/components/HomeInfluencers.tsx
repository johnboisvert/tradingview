// Social-proof block: Top 10 quiz influencers (lifetime share count, anonymized email).
// Mounted under the Hero on the homepage. Hidden when the list is empty.
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Trophy, Share2, ArrowRight } from "lucide-react";

interface Influencer {
  email_anonymized: string;
  total_shares: number;
  unlocked_at: string;
}

interface Resp {
  ok: boolean;
  influencers: Influencer[];
  total_count: number;
  threshold: number;
}

export default function HomeInfluencers() {
  const [data, setData] = useState<Resp | null>(null);

  useEffect(() => {
    let alive = true;
    fetch("/api/v1/quiz/influencers?limit=10")
      .then(r => r.json())
      .then(j => { if (alive && j?.ok) setData(j); })
      .catch(() => {});
    return () => { alive = false; };
  }, []);

  if (!data || data.influencers.length === 0) return null;

  return (
    <section
      data-testid="home-influencers"
      className="relative py-12 md:py-16 bg-gradient-to-b from-transparent via-amber-500/[0.02] to-transparent"
    >
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/30 flex items-center justify-center">
            <Trophy className="w-5 h-5 text-amber-300" />
          </div>
          <div>
            <h2 className="text-xl md:text-2xl font-black text-white">
              Top Influenceurs CryptoIA
            </h2>
            <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">
              {data.total_count} ambassadeur{data.total_count > 1 ? "s" : ""} · {data.threshold}+ partages chacun
            </p>
          </div>
          <Link
            to="/quiz"
            data-testid="home-influencers-cta"
            className="ml-auto hidden md:inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-gradient-to-r from-amber-500/15 to-orange-500/15 border border-amber-500/30 text-amber-200 text-xs font-extrabold hover:from-amber-500/25 hover:to-orange-500/25 transition-all"
          >
            Deviens-en un <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 md:gap-3">
          {data.influencers.map((inf, idx) => (
            <div
              key={idx}
              data-testid={`influencer-card-${idx}`}
              className={`relative rounded-2xl border bg-[#0d0e16] p-3 md:p-4 transition-all hover:-translate-y-0.5 ${
                idx === 0
                  ? "border-amber-400/50 shadow-lg shadow-amber-500/10"
                  : "border-white/[0.06] hover:border-amber-400/30"
              }`}
            >
              {idx < 3 && (
                <div className={`absolute -top-2 -left-2 w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-black text-black ${
                  idx === 0 ? "bg-amber-300" : idx === 1 ? "bg-gray-300" : "bg-orange-400"
                }`}>
                  {idx + 1}
                </div>
              )}
              <div className="flex items-center justify-between mb-2">
                <div className="text-2xl">{idx === 0 ? "🏆" : idx < 3 ? "🥇" : "⭐"}</div>
                <div className="flex items-center gap-1 text-[10px] text-amber-300 font-extrabold">
                  <Share2 className="w-3 h-3" />
                  {inf.total_shares}
                </div>
              </div>
              <div className="text-xs font-mono font-bold text-gray-300 truncate" title={inf.email_anonymized}>
                {inf.email_anonymized}
              </div>
              <div className="text-[9px] text-gray-600 font-bold mt-0.5 uppercase tracking-wider">
                {idx === 0 ? "Top ambassador" : "Influenceur"}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 text-center md:hidden">
          <Link
            to="/quiz"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-gradient-to-r from-amber-500/15 to-orange-500/15 border border-amber-500/30 text-amber-200 text-xs font-extrabold"
          >
            Deviens-en un <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </section>
  );
}
