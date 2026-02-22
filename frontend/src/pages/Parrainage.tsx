import { useState, useEffect } from "react";
import Sidebar, { MobileTopBar } from "@/components/Sidebar";
import PageHeader from "@/components/PageHeader";
import Footer from "@/components/Footer";
import { getUserSession } from "@/lib/store";
import {
  Gift,
  Copy,
  Check,
  Users,
  DollarSign,
  TrendingUp,
  Share2,
  Facebook,
  MessageCircle,
  Send,
  Award,
  Sparkles,
  Star,
  ChevronRight,
} from "lucide-react";

interface ReferralStats {
  referral_code: string;
  total_referrals: number;
  paid_referrals: number;
  rewards_earned: number;
  referrals: { username: string; plan: string; created_at: string; is_paid: boolean }[];
}

const REWARD_TIERS = [
  { min: 1, reward: "1 mois Premium gratuit", icon: Star, color: "from-blue-500 to-blue-600" },
  { min: 5, reward: "1 mois Advanced gratuit", icon: Award, color: "from-purple-500 to-purple-600" },
  { min: 10, reward: "1 mois Pro gratuit", icon: Sparkles, color: "from-amber-500 to-amber-600" },
  { min: 25, reward: "1 mois Elite gratuit", icon: Gift, color: "from-emerald-500 to-emerald-600" },
];

export default function Parrainage() {
  const session = getUserSession();
  const [stats, setStats] = useState<ReferralStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");

  const username = session?.username || "";
  const referralLink = `https://cryptoia.ca/?ref=${username}`;

  useEffect(() => {
    if (!username) {
      setLoading(false);
      return;
    }
    fetch(`/api/referral/${encodeURIComponent(username)}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setStats(data.stats);
        } else {
          setError(data.message || "Erreur lors du chargement");
        }
      })
      .catch(() => setError("Serveur indisponible"))
      .finally(() => setLoading(false));
  }, [username]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      const input = document.createElement("input");
      input.value = referralLink;
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const shareText = encodeURIComponent(
    `🚀 Rejoins CryptoIA, la plateforme de trading crypto #1 ! Utilise mon lien pour t'inscrire : ${referralLink}`
  );

  const shareLinks = [
    {
      name: "Facebook",
      icon: Facebook,
      color: "from-blue-600 to-blue-700",
      url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(referralLink)}&quote=${shareText}`,
    },
    {
      name: "X (Twitter)",
      icon: Share2,
      color: "from-gray-700 to-gray-800",
      url: `https://twitter.com/intent/tweet?text=${shareText}`,
    },
    {
      name: "Telegram",
      icon: Send,
      color: "from-sky-500 to-sky-600",
      url: `https://t.me/share/url?url=${encodeURIComponent(referralLink)}&text=${shareText}`,
    },
    {
      name: "WhatsApp",
      icon: MessageCircle,
      color: "from-green-500 to-green-600",
      url: `https://wa.me/?text=${shareText}`,
    },
  ];

  if (!session) {
    return (
      <div className="flex min-h-screen bg-[#060A14]">
        <Sidebar />
        <div className="flex-1 md:ml-[260px] mt-14 md:mt-0">
          <main className="max-w-5xl mx-auto px-4 py-8">
            <PageHeader title="Parrainage" subtitle="Connectez-vous pour accéder à votre programme de parrainage" />
            <div className="bg-[#111827] border border-white/[0.06] rounded-2xl p-8 text-center">
              <Gift className="w-16 h-16 text-indigo-400 mx-auto mb-4" />
              <h2 className="text-xl font-bold text-white mb-2">Connectez-vous pour commencer</h2>
              <p className="text-gray-400 mb-6">
                Vous devez être connecté pour accéder à votre lien de parrainage et suivre vos récompenses.
              </p>
              <a
                href="/login"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-bold hover:opacity-90 transition-all"
              >
                Se connecter
                <ChevronRight className="w-4 h-4" />
              </a>
            </div>
          </main>
          <Footer />
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#060A14]">
      <Sidebar />
      <div className="flex-1 md:ml-[260px] mt-14 md:mt-0">
        <main className="max-w-5xl mx-auto px-4 py-8">
          <PageHeader
            title="Programme de Parrainage"
            subtitle="Invitez vos amis et gagnez des récompenses exclusives"
          />

          {loading ? (
            <div className="flex items-center justify-center h-[40vh]">
              <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : error ? (
            <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-6 text-center">
              <p className="text-red-400 font-bold">{error}</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Referral Link Card */}
              <div className="bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-transparent border border-indigo-500/20 rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                    <Gift className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-white">Votre lien de parrainage</h2>
                    <p className="text-xs text-gray-400">Partagez ce lien pour inviter vos amis</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex-1 bg-[#0A0E1A] border border-white/[0.08] rounded-xl px-4 py-3 font-mono text-sm text-indigo-300 truncate">
                    {referralLink}
                  </div>
                  <button
                    onClick={handleCopy}
                    className={`flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-sm transition-all ${
                      copied
                        ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                        : "bg-gradient-to-r from-indigo-500 to-purple-600 text-white hover:opacity-90"
                    }`}
                  >
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    {copied ? "Copié !" : "Copier"}
                  </button>
                </div>

                {/* Share Buttons */}
                <div className="mt-4 flex flex-wrap gap-3">
                  {shareLinks.map((link) => (
                    <a
                      key={link.name}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r ${link.color} text-white text-sm font-bold hover:opacity-90 transition-all`}
                    >
                      <link.icon className="w-4 h-4" />
                      {link.name}
                    </a>
                  ))}
                </div>
              </div>

              {/* Stats Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-[#111827] border border-white/[0.06] rounded-2xl p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                      <Users className="w-5 h-5 text-blue-400" />
                    </div>
                    <p className="text-xs font-bold text-gray-400 uppercase">Filleuls inscrits</p>
                  </div>
                  <p className="text-3xl font-black text-white">{stats?.total_referrals ?? 0}</p>
                </div>

                <div className="bg-[#111827] border border-white/[0.06] rounded-2xl p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                      <DollarSign className="w-5 h-5 text-emerald-400" />
                    </div>
                    <p className="text-xs font-bold text-gray-400 uppercase">Filleuls payants</p>
                  </div>
                  <p className="text-3xl font-black text-emerald-400">{stats?.paid_referrals ?? 0}</p>
                </div>

                <div className="bg-[#111827] border border-white/[0.06] rounded-2xl p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
                      <TrendingUp className="w-5 h-5 text-amber-400" />
                    </div>
                    <p className="text-xs font-bold text-gray-400 uppercase">Récompenses gagnées</p>
                  </div>
                  <p className="text-3xl font-black text-amber-400">{stats?.rewards_earned ?? 0}</p>
                </div>
              </div>

              {/* Reward Tiers */}
              <div className="bg-[#111827] border border-white/[0.06] rounded-2xl p-6">
                <h3 className="text-lg font-bold text-white mb-4">🎁 Paliers de récompenses</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {REWARD_TIERS.map((tier) => {
                    const reached = (stats?.paid_referrals ?? 0) >= tier.min;
                    return (
                      <div
                        key={tier.min}
                        className={`relative rounded-xl border p-4 transition-all ${
                          reached
                            ? "border-emerald-500/30 bg-emerald-500/5"
                            : "border-white/[0.06] bg-white/[0.02]"
                        }`}
                      >
                        {reached && (
                          <div className="absolute top-2 right-2">
                            <Check className="w-5 h-5 text-emerald-400" />
                          </div>
                        )}
                        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${tier.color} flex items-center justify-center mb-3`}>
                          <tier.icon className="w-5 h-5 text-white" />
                        </div>
                        <p className="text-sm font-bold text-white mb-1">{tier.min} filleul{tier.min > 1 ? "s" : ""} payant{tier.min > 1 ? "s" : ""}</p>
                        <p className="text-xs text-gray-400">{tier.reward}</p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Referrals Table */}
              {stats && stats.referrals.length > 0 && (
                <div className="bg-[#111827] border border-white/[0.06] rounded-2xl overflow-hidden">
                  <div className="p-5 border-b border-white/[0.06]">
                    <h3 className="text-base font-bold text-white">Vos filleuls</h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-white/[0.06]">
                          <th className="text-left text-xs font-bold text-gray-400 uppercase px-5 py-3">Utilisateur</th>
                          <th className="text-left text-xs font-bold text-gray-400 uppercase px-5 py-3">Plan</th>
                          <th className="text-left text-xs font-bold text-gray-400 uppercase px-5 py-3">Date d'inscription</th>
                          <th className="text-left text-xs font-bold text-gray-400 uppercase px-5 py-3">Statut</th>
                        </tr>
                      </thead>
                      <tbody>
                        {stats.referrals.map((ref, i) => (
                          <tr key={i} className="border-b border-white/[0.03] hover:bg-white/[0.02]">
                            <td className="px-5 py-3 text-sm font-bold text-white">{ref.username}</td>
                            <td className="px-5 py-3 text-sm text-gray-400 capitalize">{ref.plan}</td>
                            <td className="px-5 py-3 text-sm text-gray-400">
                              {new Date(ref.created_at).toLocaleDateString("fr-CA")}
                            </td>
                            <td className="px-5 py-3">
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  ref.is_paid
                                    ? "bg-emerald-500/10 text-emerald-400"
                                    : "bg-gray-500/10 text-gray-400"
                                }`}
                              >
                                {ref.is_paid ? "Payant" : "Gratuit"}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* How it works */}
              <div className="bg-[#111827] border border-white/[0.06] rounded-2xl p-6">
                <h3 className="text-lg font-bold text-white mb-4">💡 Comment ça marche ?</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  {[
                    { step: "1", title: "Partagez votre lien", desc: "Envoyez votre lien unique à vos amis via les réseaux sociaux ou par message." },
                    { step: "2", title: "Vos amis s'inscrivent", desc: "Quand ils s'inscrivent via votre lien, ils sont automatiquement liés à votre compte." },
                    { step: "3", title: "Gagnez des récompenses", desc: "Pour chaque filleul qui souscrit un abonnement payant, vous gagnez des récompenses !" },
                  ].map((item) => (
                    <div key={item.step} className="text-center">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 flex items-center justify-center mx-auto mb-3">
                        <span className="text-white font-black text-sm">{item.step}</span>
                      </div>
                      <h4 className="text-sm font-bold text-white mb-1">{item.title}</h4>
                      <p className="text-xs text-gray-400">{item.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </main>
        <Footer />
      </div>
    </div>
  );
}