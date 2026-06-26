// Public trader profile page — /u/:username
// Minimal: badges + ROI + 'Follow on Challenge' CTA + share buttons. Uses the
// public/user/:username API which never leaks email/positions/balance.
import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import Sidebar from "@/components/Sidebar";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import { Trophy, ArrowRight, Twitter, Facebook, Linkedin, MessageCircle, Link2, Check, Share2, Lock } from "lucide-react";
import type { AchievementMeta } from "./challenge/types";
import { fmtUsd } from "./challenge/format";

interface PublicUser {
  username: string;
  equity: number;
  roi_pct: number;
  achievements: Array<AchievementMeta & { unlocked_at: string }>;
  catalog_count: number;
  win_streak: number;
  stats: Record<string, number>;
  equity_history: Array<{ ts: string; equity: number }>;
  period: string;
}

export default function PublicProfile() {
  const { username } = useParams();
  const [user, setUser] = useState<PublicUser | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

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

  const shareUrl = `https://www.cryptoia.ca/u/${encodeURIComponent(username || "")}`;
  const seoTitle = user ? `${user.username} · ${user.roi_pct >= 0 ? "+" : ""}${user.roi_pct.toFixed(1)}% ROI · CryptoIA Pro Challenge` : "Profil trader · CryptoIA";
  const seoDesc = user
    ? `${user.username} a débloqué ${user.achievements.length} badges sur le Pro Trading Challenge avec ${user.roi_pct >= 0 ? "+" : ""}${user.roi_pct.toFixed(2)}% de ROI. Découvre son profil et challenge-le.`
    : "Voir le profil public d'un trader sur le Pro Trading Challenge CryptoIA.";

  function share(platform: string) {
    const text = user ? `Check out ${user.username}'s ${user.roi_pct >= 0 ? "+" : ""}${user.roi_pct.toFixed(1)}% ROI on CryptoIA Pro Challenge 🚀` : "";
    const encUrl = encodeURIComponent(shareUrl);
    const encText = encodeURIComponent(text);
    let href = "";
    if (platform === "twitter") href = `https://twitter.com/intent/tweet?text=${encText}&url=${encUrl}`;
    else if (platform === "facebook") href = `https://www.facebook.com/sharer/sharer.php?u=${encUrl}`;
    else if (platform === "linkedin") href = `https://www.linkedin.com/sharing/share-offsite/?url=${encUrl}`;
    else if (platform === "whatsapp") href = `https://wa.me/?text=${encText}%20${encUrl}`;
    if (href) window.open(href, "_blank", "noopener,noreferrer,width=600,height=600");
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* ignore */ }
  }

  return (
    <div className="min-h-screen bg-[#0A0E1A] text-white">
      <SEOHead title={seoTitle} description={seoDesc} path={`/u/${username || ""}`} />
      <Sidebar />
      <main className="lg:ml-20 px-4 md:px-8 py-10 max-w-4xl mx-auto">
        {error ? (
          <div className="text-center py-20" data-testid="profile-error">
            <div className="text-5xl mb-4">🔎</div>
            <h1 className="text-2xl font-black mb-2">{error}</h1>
            <p className="text-gray-400 text-sm mb-6">Le pseudo &laquo;&nbsp;{username}&nbsp;&raquo; n&apos;existe pas dans le Pro Trading Challenge.</p>
            <Link to="/challenge" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-black font-extrabold text-sm hover:from-amber-400 hover:to-orange-400 transition-all">
              Découvrir le Challenge <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        ) : !user ? (
          <div className="text-center py-20 text-gray-500">Chargement…</div>
        ) : (
          <div data-testid="public-profile">
            {/* Hero card */}
            <div className="rounded-3xl overflow-hidden bg-gradient-to-br from-[#15182a] via-[#0d0e16] to-[#1a1d2e] border border-white/[0.08] p-6 md:p-8 mb-6 relative">
              <div className="absolute top-4 right-4 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-[10px] font-extrabold text-amber-300 uppercase tracking-wider">
                Pro Challenge · {user.period}
              </div>
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-gradient-to-br from-purple-500/30 to-pink-500/30 border border-purple-400/40 flex items-center justify-center text-3xl md:text-4xl font-black">
                  {user.username.slice(0, 1).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <h1 className="text-2xl md:text-3xl font-black mb-1 truncate">{user.username}</h1>
                  <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">{user.achievements.length} badges débloqués</p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3 md:gap-4">
                <Stat label="ROI" value={`${user.roi_pct >= 0 ? "+" : ""}${user.roi_pct.toFixed(2)}%`} color={user.roi_pct >= 0 ? "emerald" : "red"} />
                <Stat label="Equity" value={`$${fmtUsd(user.equity)}`} />
                <Stat label="Win Streak" value={`${user.win_streak}`} color="amber" />
              </div>
            </div>

            {/* Badges grid */}
            <section data-testid="profile-badges" className="bg-[#111827] border border-white/[0.06] rounded-2xl p-5 md:p-6 mb-6">
              <div className="flex items-center gap-2 mb-4">
                <Trophy className="w-4 h-4 text-amber-400" />
                <h2 className="text-sm font-extrabold uppercase tracking-wider">Badges</h2>
                <span className="ml-auto text-xs text-amber-300 font-mono font-bold">{user.achievements.length}/{user.catalog_count}</span>
              </div>
              {user.achievements.length === 0 ? (
                <div className="grid grid-cols-5 md:grid-cols-10 gap-2">
                  {Array.from({ length: 10 }).map((_, i) => (
                    <div key={i} className="aspect-square rounded-xl bg-white/[0.03] border border-white/[0.04] flex items-center justify-center">
                      <Lock className="w-4 h-4 text-gray-700" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-5 md:grid-cols-10 gap-2 md:gap-3">
                  {user.achievements.map(a => (
                    <div
                      key={a.key}
                      title={`${a.name} — ${a.desc}`}
                      data-testid={`profile-badge-${a.key}`}
                      className="aspect-square rounded-xl bg-gradient-to-br from-amber-500/30 to-orange-500/30 border border-amber-500/50 shadow-md shadow-amber-500/10 flex items-center justify-center text-xl md:text-2xl"
                    >
                      {a.emoji}
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* CTAs row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
              <Link
                to={`/challenge?ref=${encodeURIComponent(user.username)}`}
                data-testid="profile-follow-cta"
                className="flex items-center justify-center gap-2 px-6 py-4 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-black font-extrabold text-sm hover:from-emerald-400 hover:to-cyan-400 transition-all"
              >
                Challenge-le → /challenge <ArrowRight className="w-4 h-4" />
              </Link>
              <a
                href={`https://www.cryptoia.ca/embed/badges/${encodeURIComponent(user.username)}?theme=dark`}
                target="_blank"
                rel="noopener noreferrer"
                data-testid="profile-embed-link"
                className="flex items-center justify-center gap-2 px-6 py-4 rounded-xl bg-white/[0.05] border border-white/10 text-gray-200 font-extrabold text-sm hover:bg-white/[0.1] hover:border-white/20 transition"
              >
                Voir l&apos;embed widget <ArrowRight className="w-4 h-4" />
              </a>
            </div>

            {/* Share bar */}
            <div data-testid="profile-share" className="bg-[#111827] border border-white/[0.06] rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <Share2 className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-extrabold uppercase tracking-wider">Partage ce profil</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                <ShareBtn onClick={() => share("twitter")} testid="profile-share-twitter" icon={<Twitter className="w-3.5 h-3.5" />} label="X" />
                <ShareBtn onClick={() => share("facebook")} testid="profile-share-facebook" icon={<Facebook className="w-3.5 h-3.5" />} label="Facebook" />
                <ShareBtn onClick={() => share("linkedin")} testid="profile-share-linkedin" icon={<Linkedin className="w-3.5 h-3.5" />} label="LinkedIn" />
                <ShareBtn onClick={() => share("whatsapp")} testid="profile-share-whatsapp" icon={<MessageCircle className="w-3.5 h-3.5" />} label="WhatsApp" emerald />
                <ShareBtn onClick={copyLink} testid="profile-share-copy" icon={copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Link2 className="w-3.5 h-3.5" />} label={copied ? "Copié" : "Lien"} />
              </div>
            </div>
          </div>
        )}
        <Footer />
      </main>
    </div>
  );
}

function Stat({ label, value, color }: { label: string; value: string; color?: "emerald" | "red" | "amber" }) {
  const c = color === "emerald" ? "text-emerald-400" : color === "red" ? "text-red-400" : color === "amber" ? "text-amber-300" : "text-white";
  return (
    <div className="rounded-xl bg-black/30 border border-white/[0.04] p-3 md:p-4">
      <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-1">{label}</div>
      <div className={`text-lg md:text-2xl font-black font-mono ${c}`}>{value}</div>
    </div>
  );
}

function ShareBtn({ onClick, testid, icon, label, emerald }: { onClick: () => void; testid: string; icon: React.ReactNode; label: string; emerald?: boolean }) {
  const cls = emerald
    ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/25"
    : "bg-white/[0.05] border-white/10 text-gray-100 hover:bg-white/[0.12] hover:border-white/20";
  return (
    <button onClick={onClick} data-testid={testid} className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full border text-xs font-bold transition ${cls}`}>
      {icon} {label}
    </button>
  );
}
