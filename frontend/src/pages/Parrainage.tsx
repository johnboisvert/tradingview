import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import Sidebar from "@/components/Sidebar";
import Footer from "@/components/Footer";
import PageHeader from "@/components/PageHeader";
import Confetti from "@/components/Confetti";
import {
  Gift, Copy, Check, Share2, Users, TrendingUp, Award, Crown,
  Trophy, AlertCircle, Calendar, Sparkles, Mail, MessageCircle,
} from "lucide-react";

type Stats = {
  clicks: number;
  signups: number;
  conversions: number;
  valid_conversions: number;
  rejected_fraud: number;
  total_revenue_generated: number;
};
type Rewards = {
  free_months_credit: number;
  free_months_per_filleul: number;
  filleul_discount_percent: number;
};
type Me = {
  ok: true;
  referralCode: string;
  link: string;
  stats: Stats;
  rewards: Rewards;
  filleul_share_text: string;
};
type LeaderRow = {
  code: string;
  alias: string;
  conversions: number;
  signups: number;
  clicks: number;
  revenue: number;
  free_months_earned: number;
};

function getStoredUsername(): string | null {
  try {
    const raw = localStorage.getItem("cryptoia_user");
    if (raw) {
      const u = JSON.parse(raw);
      return u?.username || u?.email || null;
    }
  } catch (_) {
    // ignore
  }
  return null;
}

export default function Parrainage() {
  const [username, setUsername] = useState<string>(getStoredUsername() || "");
  const [needsLogin, setNeedsLogin] = useState<boolean>(!getStoredUsername());
  const [me, setMe] = useState<Me | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderRow[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [copied, setCopied] = useState<"code" | "link" | "text" | null>(null);
  const [error, setError] = useState<string>("");
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    if (!username) return;
    setLoading(true);
    setError("");
    Promise.all([
      fetch(`/api/v1/referral/me?username=${encodeURIComponent(username)}`).then(r => r.json()),
      fetch(`/api/v1/referral/leaderboard`).then(r => r.json()),
    ])
      .then(([m, lb]) => {
        if (m?.ok) setMe(m);
        else setError(m?.error || "Compte introuvable");
        if (lb?.ok) setLeaderboard(lb.top || []);
      })
      .catch(e => setError("Erreur réseau : " + e?.message))
      .finally(() => setLoading(false));
  }, [username]);

  const myRank = useMemo(() => {
    if (!me) return null;
    const idx = leaderboard.findIndex(r => r.code === me.referralCode);
    return idx >= 0 ? idx + 1 : null;
  }, [me, leaderboard]);

  const copyToClipboard = async (text: string, kind: "code" | "link" | "text") => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(kind);
      setTimeout(() => setCopied(null), 1800);
    } catch (_) {
      setError("Impossible de copier");
    }
  };

  const handleLoginContinue = () => {
    const u = (document.getElementById("ref-login-input") as HTMLInputElement | null)?.value?.trim();
    if (!u) return;
    localStorage.setItem("cryptoia_user", JSON.stringify({ username: u, email: u.includes("@") ? u : null }));
    setUsername(u);
    setNeedsLogin(false);
  };

  const shareTwitter = () => {
    if (!me) return;
    const url = encodeURIComponent(me.filleul_share_text);
    window.open(`https://twitter.com/intent/tweet?text=${url}`, "_blank");
  };
  const shareWhatsapp = () => {
    if (!me) return;
    const url = encodeURIComponent(me.filleul_share_text);
    window.open(`https://wa.me/?text=${url}`, "_blank");
  };
  const shareEmail = () => {
    if (!me) return;
    const subject = encodeURIComponent("Rejoins-moi sur CryptoIA — -20% sur ton 1er mois");
    const body = encodeURIComponent(me.filleul_share_text);
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  };

  // Celebrate when free_months_credit > 0
  useEffect(() => {
    if (me && me.rewards.free_months_credit > 0) {
      setShowConfetti(true);
      const t = setTimeout(() => setShowConfetti(false), 3500);
      return () => clearTimeout(t);
    }
  }, [me]);

  return (
    <div className="flex min-h-screen bg-[#030712]" data-testid="parrainage-page">
      <Sidebar />
      <main className="flex-1 md:ml-[260px] p-4 md:p-7 pt-[72px] md:pt-7 max-w-7xl mx-auto">
        {showConfetti && <Confetti />}
        <PageHeader
          icon={<Gift className="w-6 h-6" />}
          title="Mon Parrainage"
          subtitle="Partage ton code unique. Chaque filleul converti = +1 mois gratuit pour toi et -20% pour lui."
          accentColor="emerald"
        />

        {needsLogin && (
          <div className="mt-8 rounded-2xl border border-amber-500/30 bg-amber-500/5 p-6" data-testid="login-prompt">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="text-amber-200 font-bold mb-2">Connecte-toi pour récupérer ton code</h3>
                <p className="text-amber-100/70 text-sm mb-4">
                  Entre ton nom d&apos;utilisateur ou ton email pour accéder à ton tableau de parrainage personnel.
                </p>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    id="ref-login-input"
                    type="text"
                    placeholder="john@example.com ou john_b"
                    className="flex-1 px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white focus:border-emerald-500 focus:outline-none text-sm"
                    data-testid="ref-login-input"
                  />
                  <button
                    onClick={handleLoginContinue}
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-white font-bold text-sm hover:opacity-90 transition"
                    data-testid="ref-login-submit"
                  >
                    Continuer
                  </button>
                </div>
                <p className="text-xs text-amber-100/50 mt-3">
                  Pas encore de compte ? <Link to="/abonnements" className="text-emerald-400 underline">Choisis un plan</Link>
                </p>
              </div>
            </div>
          </div>
        )}

        {!needsLogin && loading && (
          <div className="mt-12 text-center text-slate-400" data-testid="ref-loading">Chargement de tes stats…</div>
        )}

        {!needsLogin && error && (
          <div className="mt-8 rounded-xl border border-red-500/30 bg-red-500/5 p-5 text-red-300" data-testid="ref-error">
            <AlertCircle className="inline w-5 h-5 mr-2" />{error}
          </div>
        )}

        {me && (
          <>
            {/* Hero: my code + share link */}
            <section className="mt-8 rounded-3xl bg-gradient-to-br from-emerald-500/15 via-cyan-500/10 to-purple-500/10 border border-emerald-500/30 p-6 md:p-8" data-testid="my-code-card">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <p className="text-emerald-300 text-xs font-bold uppercase tracking-wider mb-2 flex items-center gap-2">
                    <Sparkles className="w-3.5 h-3.5" /> Ton code unique
                  </p>
                  <div className="flex items-center gap-3 mt-2">
                    <span
                      className="text-3xl md:text-5xl font-black text-white font-mono tracking-wider select-all"
                      data-testid="my-referral-code"
                    >
                      {me.referralCode}
                    </span>
                    <button
                      onClick={() => copyToClipboard(me.referralCode, "code")}
                      className="px-3 py-2 rounded-lg bg-slate-900/60 border border-slate-700 hover:border-emerald-500 transition"
                      data-testid="copy-code-btn"
                      title="Copier le code"
                    >
                      {copied === "code" ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-slate-300" />}
                    </button>
                  </div>
                  <p className="text-slate-300 text-sm mt-4">Lien à partager :</p>
                  <div className="flex items-center gap-2 mt-2">
                    <code className="flex-1 px-3 py-2 rounded-lg bg-slate-950/60 border border-slate-800 text-emerald-300 text-xs overflow-hidden text-ellipsis whitespace-nowrap" data-testid="my-referral-link">
                      {me.link}
                    </code>
                    <button
                      onClick={() => copyToClipboard(me.link, "link")}
                      className="px-3 py-2 rounded-lg bg-emerald-500/20 border border-emerald-500/40 hover:bg-emerald-500/30 transition"
                      data-testid="copy-link-btn"
                    >
                      {copied === "link" ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-emerald-300" />}
                    </button>
                  </div>
                </div>
                <div className="flex flex-col justify-center md:items-end">
                  <div className="text-center md:text-right">
                    <p className="text-slate-300 text-xs uppercase tracking-wider mb-1">Crédit accumulé</p>
                    <p className="text-5xl md:text-6xl font-black bg-gradient-to-br from-emerald-300 to-cyan-300 bg-clip-text text-transparent" data-testid="free-months-counter">
                      {me.rewards.free_months_credit}
                    </p>
                    <p className="text-emerald-200 text-sm font-semibold mt-1">
                      mois gratuit{me.rewards.free_months_credit > 1 ? "s" : ""}
                    </p>
                    <p className="text-slate-400 text-xs mt-2">
                      +{me.rewards.free_months_per_filleul} mois / filleul converti
                    </p>
                  </div>
                </div>
              </div>

              {/* Share buttons */}
              <div className="mt-6 pt-6 border-t border-emerald-500/20 flex flex-wrap items-center gap-3">
                <span className="text-sm font-bold text-slate-200 flex items-center gap-2">
                  <Share2 className="w-4 h-4" /> Partager :
                </span>
                <button onClick={shareTwitter} className="px-4 py-2 rounded-lg bg-slate-900 border border-slate-700 hover:border-cyan-400 text-sm text-slate-200 flex items-center gap-2 transition" data-testid="share-twitter">
                  <span className="text-cyan-400">𝕏</span> Twitter
                </button>
                <button onClick={shareWhatsapp} className="px-4 py-2 rounded-lg bg-slate-900 border border-slate-700 hover:border-emerald-400 text-sm text-slate-200 flex items-center gap-2 transition" data-testid="share-whatsapp">
                  <MessageCircle className="w-4 h-4 text-emerald-400" /> WhatsApp
                </button>
                <button onClick={shareEmail} className="px-4 py-2 rounded-lg bg-slate-900 border border-slate-700 hover:border-amber-400 text-sm text-slate-200 flex items-center gap-2 transition" data-testid="share-email">
                  <Mail className="w-4 h-4 text-amber-400" /> Email
                </button>
                <button onClick={() => copyToClipboard(me.filleul_share_text, "text")} className="px-4 py-2 rounded-lg bg-slate-900 border border-slate-700 hover:border-purple-400 text-sm text-slate-200 flex items-center gap-2 transition" data-testid="share-copy-text">
                  {copied === "text" ? <Check className="w-4 h-4 text-purple-400" /> : <Copy className="w-4 h-4 text-purple-400" />}
                  Copier le message
                </button>
              </div>
            </section>

            {/* Stats grid */}
            <section className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4" data-testid="stats-grid">
              <StatCard icon={<TrendingUp className="w-5 h-5 text-cyan-400" />} label="Clics sur ton lien" value={me.stats.clicks} testId="stat-clicks" />
              <StatCard icon={<Users className="w-5 h-5 text-emerald-400" />} label="Inscriptions" value={me.stats.signups} testId="stat-signups" />
              <StatCard icon={<Award className="w-5 h-5 text-purple-400" />} label="Filleuls payants" value={me.stats.valid_conversions} testId="stat-conversions" highlight />
              <StatCard icon={<Calendar className="w-5 h-5 text-amber-400" />} label="Revenu généré" value={`$${me.stats.total_revenue_generated.toFixed(0)}`} testId="stat-revenue" />
            </section>

            {/* How it works */}
            <section className="mt-8 rounded-2xl border border-slate-800 bg-slate-900/40 p-6" data-testid="how-it-works">
              <h2 className="text-xl font-black text-white flex items-center gap-2 mb-4">
                <Gift className="w-5 h-5 text-emerald-400" /> Comment ça marche
              </h2>
              <div className="grid md:grid-cols-3 gap-4">
                <Step n="1" title="Partage ton lien" desc={`Envoie ton code ${me.referralCode} à tes amis crypto.`} />
                <Step n="2" title="Ton ami s'inscrit & paye" desc={`Il reçoit -${me.rewards.filleul_discount_percent}% sur son 1er paiement (mensuel OU annuel).`} />
                <Step n="3" title="Tu gagnes +1 mois gratuit" desc="Crédité automatiquement, cumulable à vie." />
              </div>
              <div className="mt-5 p-4 rounded-xl bg-amber-500/5 border border-amber-500/20 text-amber-200/80 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-amber-400" />
                <div>
                  <strong className="text-amber-300">Anti-fraude :</strong> Pour qu&apos;un parrainage soit validé, ton filleul doit s&apos;inscrire avec une <strong>adresse email différente de la tienne</strong> et payer avec une <strong>carte bancaire différente</strong>. Les tentatives de doublons sont automatiquement rejetées.
                </div>
              </div>
            </section>

            {/* Leaderboard */}
            <section className="mt-8 rounded-2xl border border-slate-800 bg-slate-900/40 p-6" data-testid="leaderboard">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-black text-white flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-amber-400" /> Classement du mois
                </h2>
                {myRank && (
                  <span className="text-xs text-emerald-300 font-bold px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30" data-testid="my-rank">
                    Ton rang : #{myRank}
                  </span>
                )}
              </div>
              {leaderboard.length === 0 ? (
                <p className="text-slate-400 text-sm">Aucun parrain actif ce mois-ci. Sois le premier !</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm" data-testid="leaderboard-table">
                    <thead>
                      <tr className="text-left text-slate-400 border-b border-slate-800">
                        <th className="py-2 px-2">#</th>
                        <th className="py-2 px-2">Parrain</th>
                        <th className="py-2 px-2 text-right">Filleuls</th>
                        <th className="py-2 px-2 text-right hidden sm:table-cell">Inscriptions</th>
                        <th className="py-2 px-2 text-right">Mois gagnés</th>
                      </tr>
                    </thead>
                    <tbody>
                      {leaderboard.map((row, i) => (
                        <tr
                          key={row.code}
                          className={`border-b border-slate-800/50 ${row.code === me.referralCode ? "bg-emerald-500/5" : ""}`}
                          data-testid={`leaderboard-row-${i}`}
                        >
                          <td className="py-3 px-2 font-bold">
                            {i === 0 ? <Crown className="w-4 h-4 text-amber-400 inline" /> : `${i + 1}`}
                          </td>
                          <td className="py-3 px-2 text-slate-200 font-mono">{row.alias}</td>
                          <td className="py-3 px-2 text-right text-emerald-300 font-bold">{row.conversions}</td>
                          <td className="py-3 px-2 text-right text-slate-400 hidden sm:table-cell">{row.signups}</td>
                          <td className="py-3 px-2 text-right text-amber-300 font-bold">+{row.free_months_earned}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </>
        )}

        <Footer />
      </main>
    </div>
  );
}

function StatCard({ icon, label, value, testId, highlight }: { icon: React.ReactNode; label: string; value: string | number; testId?: string; highlight?: boolean }) {
  return (
    <div
      className={`rounded-xl border p-4 ${highlight ? "border-emerald-500/40 bg-emerald-500/5" : "border-slate-800 bg-slate-900/40"}`}
      data-testid={testId}
    >
      <div className="flex items-center justify-between mb-2">
        {icon}
      </div>
      <p className="text-2xl font-black text-white">{value}</p>
      <p className="text-xs text-slate-400 mt-1">{label}</p>
    </div>
  );
}

function Step({ n, title, desc }: { n: string; title: string; desc: string }) {
  return (
    <div className="flex gap-3" data-testid={`step-${n}`}>
      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-cyan-500 text-white font-black flex items-center justify-center flex-shrink-0">
        {n}
      </div>
      <div>
        <h3 className="text-white font-bold text-sm">{title}</h3>
        <p className="text-slate-400 text-xs mt-1">{desc}</p>
      </div>
    </div>
  );
}
