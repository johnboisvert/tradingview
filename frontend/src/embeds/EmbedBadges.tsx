// Public iframe-safe widget: a user's unlocked Challenge badges.
// Usage:
//   <iframe src="https://www.cryptoia.ca/embed/badges/QATester?theme=dark"
//           width="380" height="240" frameBorder="0" />
//
// Each visitor click on "Powered by CryptoIA" or the badge grid sends them to
// /challenge?ref=<username> (referral tracking — chaque trader devient ambassadeur).
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Trophy, Lock } from "lucide-react";
import type { AchievementMeta } from "../pages/challenge/types";

interface PublicUser {
  username: string;
  equity: number;
  roi_pct: number;
  achievements: Array<AchievementMeta & { unlocked_at: string }>;
  catalog_count: number;
  win_streak: number;
  period: string;
}

export default function EmbedBadges() {
  const { username } = useParams();
  const [user, setUser] = useState<PublicUser | null>(null);
  const [error, setError] = useState<string | null>(null);
  const params = new URLSearchParams(window.location.search);
  const theme = params.get("theme") === "transparent" ? "transparent" : "dark";
  const bg = theme === "transparent" ? "transparent" : "#0a0a0f";

  useEffect(() => {
    if (!username) return;
    fetch(`/api/v1/challenge/public/user/${encodeURIComponent(username)}`)
      .then(r => r.json())
      .then(j => {
        if (j?.ok) setUser(j);
        else setError(j?.error || "Utilisateur introuvable");
      })
      .catch(() => setError("Erreur de connexion"));
  }, [username]);

  const referralLink = `https://www.cryptoia.ca/challenge?ref=${encodeURIComponent(username || "")}&utm_source=embed&utm_medium=widget&utm_campaign=badges`;

  return (
    <div
      data-testid="embed-badges"
      style={{ background: bg, color: "#e5e7eb", fontFamily: "-apple-system, BlinkMacSystemFont, Inter, sans-serif" }}
      className="min-h-screen w-full p-3"
    >
      {error ? (
        <div className="p-4 text-center text-xs text-gray-400">{error}</div>
      ) : !user ? (
        <div className="p-4 text-center text-xs text-gray-500">Chargement…</div>
      ) : (
        <a
          href={referralLink}
          target="_blank"
          rel="noopener noreferrer"
          className="block rounded-2xl overflow-hidden border border-white/[0.08] bg-gradient-to-br from-[#0d0e16] to-[#15182a] hover:border-amber-400/40 transition-all"
          data-testid="embed-badges-card"
        >
          <div className="px-4 py-3 border-b border-white/[0.05] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Trophy className="w-4 h-4 text-amber-300" />
              <div>
                <div className="text-xs font-extrabold text-white">{user.username}</div>
                <div className="text-[9px] text-gray-500 uppercase tracking-wider font-bold">Pro Trading Challenge · {user.period}</div>
              </div>
            </div>
            <div className="text-right">
              <div className={`text-sm font-black font-mono ${user.roi_pct >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                {user.roi_pct >= 0 ? "+" : ""}{user.roi_pct.toFixed(2)}%
              </div>
              <div className="text-[9px] text-gray-500 font-bold uppercase tracking-wider">ROI</div>
            </div>
          </div>
          <div className="p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] text-amber-300 font-extrabold uppercase tracking-wider">Badges débloqués</span>
              <span className="text-[10px] text-gray-500 font-mono font-bold">{user.achievements.length}/{user.catalog_count}</span>
            </div>
            {user.achievements.length === 0 ? (
              <div className="grid grid-cols-5 gap-1.5">
                {Array.from({ length: 10 }).map((_, i) => (
                  <div key={i} className="aspect-square rounded-lg bg-white/[0.03] border border-white/[0.04] flex items-center justify-center">
                    <Lock className="w-3 h-3 text-gray-700" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-5 gap-1.5">
                {user.achievements.slice(0, 10).map((a) => (
                  <div
                    key={a.key}
                    title={`${a.name} — ${a.desc}`}
                    className="aspect-square rounded-lg bg-gradient-to-br from-amber-500/30 to-orange-500/30 border border-amber-500/50 shadow-md shadow-amber-500/10 flex items-center justify-center text-lg"
                  >
                    {a.emoji}
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="px-4 py-2 bg-black/30 border-t border-white/[0.05] flex items-center justify-between">
            <span className="text-[9px] text-gray-500 font-bold">Powered by</span>
            <span className="text-[11px] font-black text-amber-300">CryptoIA →</span>
          </div>
        </a>
      )}
      <style>{`body { background: ${bg} !important; margin: 0; }`}</style>
    </div>
  );
}
