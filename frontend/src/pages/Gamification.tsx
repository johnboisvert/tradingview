import { useState, useEffect, useCallback } from "react";
import Sidebar from "@/components/Sidebar";
import PageHeader from "@/components/PageHeader";
import Footer from "@/components/Footer";
import {
  Trophy,
  Star,
  Zap,
  Shield,
  TrendingUp,
  Bell,
  BookOpen,
  BarChart2,
  Lock,
  CheckCircle2,
  Gift,
  Crown,
  Flame,
  Target,
  ArrowUp,
  ArrowDown,
  Minus,
  Sparkles,
  Users,
  ChevronRight,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Badge {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  unlocked: boolean;
  unlockedAt?: string;
  rarity: "common" | "rare" | "epic" | "legendary";
}

interface XPAction {
  id: string;
  label: string;
  xp: number;
  icon: React.ReactNode;
  claimed: boolean;
  color: string;
}

interface Challenge {
  id: string;
  title: string;
  description: string;
  current: number;
  target: number;
  xpReward: number;
  icon: React.ReactNode;
  color: string;
  deadline: string;
}

interface LeaderboardEntry {
  rank: number;
  pseudo: string;
  level: number;
  xp: number;
  badge: string;
  badgeColor: string;
  rankChange: "up" | "down" | "same";
  rankDelta: number;
  isCurrentUser?: boolean;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const STORAGE_KEY = "cryptoia_gamification";
const BASE_XP = 1200; // Starting XP for demo

function getLevelInfo(xp: number) {
  const level = Math.floor(xp / 500) + 1;
  const currentLevelXP = (level - 1) * 500;
  const nextLevelXP = level * 500;
  const progress = ((xp - currentLevelXP) / (nextLevelXP - currentLevelXP)) * 100;
  const titles = [
    "Débutant", "Apprenti", "Explorateur", "Analyste Junior", "Analyste",
    "Analyste Senior", "Trader", "Trader Expert", "Stratège", "Stratège Elite",
    "Maître Crypto", "Analyste Expert", "Grand Maître", "Légende", "Dieu du Marché",
  ];
  const title = titles[Math.min(level - 1, titles.length - 1)];
  return { level, title, currentLevelXP, nextLevelXP, progress, xpToNext: nextLevelXP - xp };
}

const RARITY_STYLES: Record<string, { border: string; bg: string; text: string; glow: string }> = {
  common:    { border: "border-gray-500/40",   bg: "bg-gray-500/10",   text: "text-gray-400",   glow: "" },
  rare:      { border: "border-blue-500/40",   bg: "bg-blue-500/10",   text: "text-blue-400",   glow: "shadow-blue-500/20" },
  epic:      { border: "border-violet-500/40", bg: "bg-violet-500/10", text: "text-violet-400", glow: "shadow-violet-500/20" },
  legendary: { border: "border-amber-500/40",  bg: "bg-amber-500/10",  text: "text-amber-400",  glow: "shadow-amber-500/30" },
};

const LEADERBOARD: LeaderboardEntry[] = [
  { rank: 1,  pseudo: "CryptoKing_FR",   level: 28, xp: 13750, badge: "👑 Légende",         badgeColor: "text-amber-400",  rankChange: "same", rankDelta: 0 },
  { rank: 2,  pseudo: "SatoshiHunter",   level: 25, xp: 12100, badge: "💎 Diamond Holder",  badgeColor: "text-cyan-400",   rankChange: "up",   rankDelta: 2 },
  { rank: 3,  pseudo: "ETH_Maxi_Pro",    level: 23, xp: 11300, badge: "🔭 Whale Watcher",   badgeColor: "text-indigo-400", rankChange: "down", rankDelta: 1 },
  { rank: 4,  pseudo: "DeFi_Wizard",     level: 21, xp: 10400, badge: "⚡ Signal Master",   badgeColor: "text-yellow-400", rankChange: "up",   rankDelta: 3 },
  { rank: 5,  pseudo: "AltcoinSniper",   level: 19, xp: 9600,  badge: "📊 Portfolio Pro",   badgeColor: "text-emerald-400",rankChange: "same", rankDelta: 0 },
  { rank: 6,  pseudo: "BullRunRider",    level: 17, xp: 8200,  badge: "🔥 Streak Master",   badgeColor: "text-orange-400", rankChange: "down", rankDelta: 2 },
  { rank: 7,  pseudo: "TradingNinja_42", level: 15, xp: 7400,  badge: "🎯 Analyste Expert", badgeColor: "text-violet-400", rankChange: "up",   rankDelta: 1 },
  { rank: 8,  pseudo: "CryptoSage",      level: 14, xp: 6800,  badge: "🛡️ Risk Master",    badgeColor: "text-blue-400",   rankChange: "same", rankDelta: 0 },
  { rank: 9,  pseudo: "MoonChaser",      level: 13, xp: 6100,  badge: "💰 Whale Watcher",  badgeColor: "text-teal-400",   rankChange: "up",   rankDelta: 4 },
  { rank: 10, pseudo: "Vous",            level: 12, xp: 5950,  badge: "🎯 Analyste Expert", badgeColor: "text-violet-400", rankChange: "up",   rankDelta: 2, isCurrentUser: true },
];

// ─── Main Component ───────────────────────────────────────────────────────────

export default function Gamification() {
  const [xp, setXp] = useState<number>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        return parsed.xp ?? BASE_XP;
      }
    } catch { /* ignore */ }
    return BASE_XP;
  });

  const [claimedActions, setClaimedActions] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        const today = new Date().toDateString();
        if (parsed.claimDate === today) return parsed.claimedActions ?? [];
      }
    } catch { /* ignore */ }
    return [];
  });

  const [showReward, setShowReward] = useState<{ xp: number; label: string } | null>(null);
  const [claimingAll, setClaimingAll] = useState(false);

  const levelInfo = getLevelInfo(xp);

  // Persist
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        xp,
        claimedActions,
        claimDate: new Date().toDateString(),
      }));
    } catch { /* ignore */ }
  }, [xp, claimedActions]);

  const actions: XPAction[] = [
    { id: "daily",    label: "Connexion quotidienne",   xp: 10,  icon: <Flame className="w-4 h-4" />,     claimed: claimedActions.includes("daily"),    color: "text-orange-400" },
    { id: "analysis", label: "Analyse d'une crypto",    xp: 25,  icon: <BarChart2 className="w-4 h-4" />, claimed: claimedActions.includes("analysis"), color: "text-blue-400" },
    { id: "signal",   label: "Signal suivi",            xp: 50,  icon: <Zap className="w-4 h-4" />,       claimed: claimedActions.includes("signal"),   color: "text-yellow-400" },
    { id: "journal",  label: "Trade journalisé",        xp: 30,  icon: <BookOpen className="w-4 h-4" />,  claimed: claimedActions.includes("journal"),  color: "text-emerald-400" },
    { id: "report",   label: "Rapport consulté",        xp: 15,  icon: <TrendingUp className="w-4 h-4" />,claimed: claimedActions.includes("report"),   color: "text-indigo-400" },
  ];

  const unclaimedXP = actions.filter((a) => !a.claimed).reduce((s, a) => s + a.xp, 0);

  const claimAction = useCallback((action: XPAction) => {
    if (action.claimed) return;
    setClaimedActions((prev) => [...prev, action.id]);
    setXp((prev) => prev + action.xp);
    setShowReward({ xp: action.xp, label: action.label });
    setTimeout(() => setShowReward(null), 2200);
  }, []);

  const claimAll = useCallback(async () => {
    if (claimingAll || unclaimedXP === 0) return;
    setClaimingAll(true);
    const unclaimed = actions.filter((a) => !a.claimed);
    let totalXP = 0;
    for (const action of unclaimed) {
      await new Promise((r) => setTimeout(r, 200));
      setClaimedActions((prev) => [...prev, action.id]);
      totalXP += action.xp;
      setXp((prev) => prev + action.xp);
    }
    setShowReward({ xp: totalXP, label: "Toutes les actions du jour" });
    setTimeout(() => setShowReward(null), 2500);
    setClaimingAll(false);
  }, [actions, claimingAll, unclaimedXP]);

  const badges: Badge[] = [
    { id: "b1", name: "Trader Débutant",   description: "Effectuer son 1er trade journalisé",       icon: <Star className="w-5 h-5" />,       color: "text-gray-400",   unlocked: true,  unlockedAt: "15 Jan 2025", rarity: "common" },
    { id: "b2", name: "Analyste Expert",   description: "Réaliser 100 analyses de cryptos",         icon: <BarChart2 className="w-5 h-5" />,  color: "text-violet-400", unlocked: true,  unlockedAt: "28 Jan 2025", rarity: "epic" },
    { id: "b3", name: "Diamond Holder",    description: "Se connecter 30 jours consécutifs",        icon: <Shield className="w-5 h-5" />,     color: "text-cyan-400",   unlocked: true,  unlockedAt: "10 Fév 2025", rarity: "rare" },
    { id: "b4", name: "Whale Watcher",     description: "Créer 10 alertes de prix",                 icon: <Bell className="w-5 h-5" />,       color: "text-indigo-400", unlocked: true,  unlockedAt: "14 Fév 2025", rarity: "rare" },
    { id: "b5", name: "Signal Master",     description: "Suivre 50 signaux IA",                     icon: <Zap className="w-5 h-5" />,        color: "text-yellow-400", unlocked: false, rarity: "epic" },
    { id: "b6", name: "Portfolio Pro",     description: "Avoir un portfolio > $10,000",             icon: <TrendingUp className="w-5 h-5" />, color: "text-emerald-400",unlocked: false, rarity: "epic" },
    { id: "b7", name: "Streak Master",     description: "Maintenir un streak de 60 jours",          icon: <Flame className="w-5 h-5" />,      color: "text-orange-400", unlocked: false, rarity: "legendary" },
    { id: "b8", name: "Crypto Légende",    description: "Atteindre le niveau 20",                   icon: <Crown className="w-5 h-5" />,      color: "text-amber-400",  unlocked: false, rarity: "legendary" },
    { id: "b9", name: "Risk Master",       description: "Utiliser le Risk Management 20 fois",      icon: <Target className="w-5 h-5" />,     color: "text-blue-400",   unlocked: false, rarity: "rare" },
  ];

  const challenges: Challenge[] = [
    { id: "c1", title: "Analyste de la semaine",    description: "Analyser 5 cryptos cette semaine",     current: 3, target: 5, xpReward: 150, icon: <BarChart2 className="w-4 h-4" />, color: "text-blue-400",   deadline: "Dim 23 Fév" },
    { id: "c2", title: "Chasseur de signaux",       description: "Suivre 10 signaux IA cette semaine",   current: 6, target: 10,xpReward: 250, icon: <Zap className="w-4 h-4" />,       color: "text-yellow-400", deadline: "Dim 23 Fév" },
    { id: "c3", title: "Journal du trader",         description: "Journaliser 3 trades cette semaine",   current: 2, target: 3, xpReward: 100, icon: <BookOpen className="w-4 h-4" />,  color: "text-emerald-400",deadline: "Dim 23 Fév" },
    { id: "c4", title: "Lecteur assidu",            description: "Consulter 4 rapports hebdomadaires",   current: 1, target: 4, xpReward: 80,  icon: <TrendingUp className="w-4 h-4" />,color: "text-indigo-400", deadline: "Dim 23 Fév" },
  ];

  return (
    <div className="min-h-screen bg-[#030712] text-white">
      <Sidebar />
      <main className="md:ml-[260px] pt-14 md:pt-0 bg-[#030712]">
        <div className="max-w-[1440px] mx-auto px-6 py-6">
          <PageHeader
            icon={<Trophy className="w-6 h-6" />}
            title="Système de Gamification"
            subtitle="Progressez, débloquez des badges et grimpez dans le classement en accomplissant des actions sur la plateforme. Chaque interaction vous rapproche du sommet !"
            accentColor="purple"
            steps={[
              { n: "1", title: "Complétez des actions pour gagner des XP", desc: "Connexion quotidienne, analyses, signaux suivis, trades journalisés — chaque action vous rapporte des XP. Réclamez vos XP du jour en un clic." },
              { n: "2", title: "Débloquez des badges exclusifs", desc: "9 badges à débloquer de rareté commune à légendaire. Chaque badge récompense une accomplissement spécifique sur la plateforme." },
              { n: "3", title: "Grimpez dans le classement", desc: "Comparez votre progression avec la communauté. Relevez les défis hebdomadaires pour gagner des XP bonus et monter dans le top 10." },
            ]}
          />

          {/* ── Reward Toast ── */}
          {showReward && (
            <div className="fixed top-6 right-6 z-50 animate-bounce">
              <div className="flex items-center gap-3 px-5 py-3 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 shadow-2xl shadow-violet-500/40 border border-violet-400/30">
                <Sparkles className="w-5 h-5 text-yellow-300" />
                <div>
                  <p className="text-xs text-violet-200 font-medium">{showReward.label}</p>
                  <p className="text-lg font-black text-white">+{showReward.xp} XP 🎉</p>
                </div>
              </div>
            </div>
          )}

          {/* ── Row 1: Profile + Actions ── */}
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-5 mb-5">
            {/* Profile Card */}
            <div className="bg-gradient-to-br from-violet-900/30 via-indigo-900/20 to-slate-900/40 border border-violet-500/20 rounded-2xl p-6">
              <div className="flex items-start justify-between mb-5">
                <div className="flex items-center gap-4">
                  {/* Avatar */}
                  <div className="relative">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center text-2xl font-black shadow-xl shadow-violet-500/30">
                      V
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-lg bg-amber-500 flex items-center justify-center text-[10px] font-black text-black shadow-lg">
                      {levelInfo.level}
                    </div>
                  </div>
                  <div>
                    <p className="text-[10px] text-violet-400 font-bold uppercase tracking-widest mb-0.5">Votre profil</p>
                    <h2 className="text-xl font-black text-white">Vous</h2>
                    <p className="text-sm text-violet-300 font-semibold">{levelInfo.title} — Niveau {levelInfo.level}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-gray-500 mb-0.5">Rang communauté</p>
                  <p className="text-2xl font-black text-amber-400">#10</p>
                  <p className="text-[10px] text-emerald-400 font-bold flex items-center gap-0.5 justify-end">
                    <ArrowUp className="w-3 h-3" /> +2 cette semaine
                  </p>
                </div>
              </div>

              {/* XP Stats */}
              <div className="grid grid-cols-3 gap-3 mb-5">
                {[
                  { label: "XP Total",        value: xp.toLocaleString("fr-FR"),                color: "text-violet-400" },
                  { label: "XP vers niv. suivant", value: levelInfo.xpToNext.toLocaleString("fr-FR"), color: "text-indigo-400" },
                  { label: "Badges débloqués", value: `${badges.filter((b) => b.unlocked).length}/${badges.length}`, color: "text-amber-400" },
                ].map((stat, i) => (
                  <div key={i} className="p-3 rounded-xl bg-black/20 border border-white/[0.05] text-center">
                    <p className="text-[10px] text-gray-500 mb-1">{stat.label}</p>
                    <p className={`text-lg font-black ${stat.color}`}>{stat.value}</p>
                  </div>
                ))}
              </div>

              {/* XP Progress Bar */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-gray-400 font-bold">Niveau {levelInfo.level}</span>
                  <span className="text-xs text-violet-400 font-black">
                    {xp - levelInfo.currentLevelXP} / {levelInfo.nextLevelXP - levelInfo.currentLevelXP} XP
                  </span>
                  <span className="text-xs text-gray-400 font-bold">Niveau {levelInfo.level + 1}</span>
                </div>
                <div className="w-full h-3 bg-black/30 rounded-full overflow-hidden border border-white/[0.05]">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-violet-600 via-indigo-500 to-purple-400 transition-all duration-700 relative overflow-hidden"
                    style={{ width: `${Math.min(levelInfo.progress, 100)}%` }}
                  >
                    <div className="absolute inset-0 bg-white/20 animate-pulse" />
                  </div>
                </div>
                <p className="text-[10px] text-gray-500 mt-1.5 text-center">
                  Encore <span className="text-violet-400 font-bold">{levelInfo.xpToNext} XP</span> pour atteindre le niveau {levelInfo.level + 1}
                </p>
              </div>
            </div>

            {/* Daily XP Actions */}
            <div className="bg-slate-900/50 border border-white/[0.07] rounded-2xl p-5 flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Gift className="w-4 h-4 text-amber-400" />
                  <span className="text-xs font-black text-white uppercase tracking-widest">XP du jour</span>
                </div>
                {unclaimedXP > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 text-[10px] font-black border border-amber-500/20">
                    +{unclaimedXP} XP disponibles
                  </span>
                )}
              </div>

              <div className="space-y-2 flex-1">
                {actions.map((action) => (
                  <button
                    key={action.id}
                    onClick={() => claimAction(action)}
                    disabled={action.claimed}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-all ${
                      action.claimed
                        ? "bg-emerald-500/5 border-emerald-500/15 cursor-default"
                        : "bg-black/20 border-white/[0.05] hover:bg-violet-500/10 hover:border-violet-500/25 cursor-pointer"
                    }`}
                  >
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${action.claimed ? "bg-emerald-500/15" : "bg-white/[0.05]"}`}>
                      <span className={action.claimed ? "text-emerald-400" : action.color}>
                        {action.claimed ? <CheckCircle2 className="w-4 h-4" /> : action.icon}
                      </span>
                    </div>
                    <span className={`flex-1 text-xs font-semibold text-left ${action.claimed ? "text-gray-500 line-through" : "text-gray-300"}`}>
                      {action.label}
                    </span>
                    <span className={`text-xs font-black ${action.claimed ? "text-emerald-500" : "text-amber-400"}`}>
                      {action.claimed ? "✓" : `+${action.xp}`}
                    </span>
                  </button>
                ))}
              </div>

              <button
                onClick={claimAll}
                disabled={unclaimedXP === 0 || claimingAll}
                className="mt-4 w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:brightness-110 transition-all disabled:opacity-40 disabled:cursor-not-allowed font-black text-sm text-black shadow-lg shadow-amber-500/20"
              >
                <Gift className="w-4 h-4" />
                {claimingAll ? "Réclamation en cours..." : unclaimedXP > 0 ? `Réclamer tout (+${unclaimedXP} XP)` : "Tout réclamé aujourd'hui ✓"}
              </button>
            </div>
          </div>

          {/* ── Row 2: Badges ── */}
          <div className="bg-slate-900/40 border border-white/[0.07] rounded-2xl p-5 mb-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-violet-400" />
                <span className="text-xs font-black text-white uppercase tracking-widest">Badges & Récompenses</span>
              </div>
              <span className="text-[10px] text-gray-500">
                {badges.filter((b) => b.unlocked).length}/{badges.length} débloqués
              </span>
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-9 gap-3">
              {badges.map((badge) => {
                const rarity = RARITY_STYLES[badge.rarity];
                return (
                  <div
                    key={badge.id}
                    className={`relative flex flex-col items-center p-3 rounded-xl border transition-all ${
                      badge.unlocked
                        ? `${rarity.bg} ${rarity.border} shadow-lg ${rarity.glow}`
                        : "bg-black/20 border-white/[0.04] opacity-50"
                    }`}
                    title={badge.description}
                  >
                    {/* Rarity glow for legendary */}
                    {badge.unlocked && badge.rarity === "legendary" && (
                      <div className="absolute inset-0 rounded-xl bg-amber-500/5 animate-pulse pointer-events-none" />
                    )}
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-2 ${badge.unlocked ? rarity.bg : "bg-white/[0.03]"}`}>
                      {badge.unlocked ? (
                        <span className={badge.color}>{badge.icon}</span>
                      ) : (
                        <Lock className="w-4 h-4 text-gray-600" />
                      )}
                    </div>
                    <p className={`text-[9px] font-black text-center leading-tight ${badge.unlocked ? "text-white" : "text-gray-600"}`}>
                      {badge.name}
                    </p>
                    {badge.unlocked && (
                      <span className={`mt-1 text-[8px] font-bold uppercase ${rarity.text}`}>{badge.rarity}</span>
                    )}
                    {badge.unlocked && badge.unlockedAt && (
                      <p className="text-[8px] text-gray-600 mt-0.5">{badge.unlockedAt}</p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── Row 3: Challenges + Leaderboard ── */}
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-5">
            {/* Weekly Challenges */}
            <div className="bg-slate-900/40 border border-white/[0.07] rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <Target className="w-4 h-4 text-indigo-400" />
                <span className="text-xs font-black text-white uppercase tracking-widest">Défis de la semaine</span>
              </div>
              <div className="space-y-3">
                {challenges.map((challenge) => {
                  const pct = Math.min((challenge.current / challenge.target) * 100, 100);
                  const done = challenge.current >= challenge.target;
                  return (
                    <div
                      key={challenge.id}
                      className={`p-4 rounded-xl border transition-all ${
                        done
                          ? "bg-emerald-500/5 border-emerald-500/15"
                          : "bg-black/20 border-white/[0.05] hover:border-indigo-500/20"
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${done ? "bg-emerald-500/15" : "bg-white/[0.04]"}`}>
                            <span className={done ? "text-emerald-400" : challenge.color}>
                              {done ? <CheckCircle2 className="w-4 h-4" /> : challenge.icon}
                            </span>
                          </div>
                          <div>
                            <p className={`text-xs font-black ${done ? "text-emerald-400" : "text-white"}`}>{challenge.title}</p>
                            <p className="text-[10px] text-gray-500">{challenge.description}</p>
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0 ml-3">
                          <p className="text-xs font-black text-amber-400">+{challenge.xpReward} XP</p>
                          <p className="text-[9px] text-gray-600">{challenge.deadline}</p>
                        </div>
                      </div>
                      {/* Progress */}
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-black/30 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-700 ${done ? "bg-emerald-500" : "bg-gradient-to-r from-indigo-600 to-violet-500"}`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className={`text-[10px] font-black flex-shrink-0 ${done ? "text-emerald-400" : "text-gray-400"}`}>
                          {challenge.current}/{challenge.target}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Leaderboard */}
            <div className="bg-slate-900/40 border border-white/[0.07] rounded-2xl p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-amber-400" />
                  <span className="text-xs font-black text-white uppercase tracking-widest">Classement Communauté</span>
                </div>
                <span className="text-[10px] text-gray-500">Top 10 traders</span>
              </div>
              <div className="space-y-1.5">
                {LEADERBOARD.map((entry) => (
                  <div
                    key={entry.rank}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${
                      entry.isCurrentUser
                        ? "bg-violet-500/10 border border-violet-500/20"
                        : "bg-black/20 border border-white/[0.03] hover:bg-white/[0.02]"
                    }`}
                  >
                    {/* Rank */}
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 text-xs font-black ${
                      entry.rank === 1 ? "bg-amber-500/20 text-amber-400" :
                      entry.rank === 2 ? "bg-gray-400/20 text-gray-300" :
                      entry.rank === 3 ? "bg-orange-600/20 text-orange-400" :
                      "bg-white/[0.04] text-gray-500"
                    }`}>
                      {entry.rank === 1 ? "👑" : entry.rank === 2 ? "🥈" : entry.rank === 3 ? "🥉" : `#${entry.rank}`}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className={`text-xs font-black truncate ${entry.isCurrentUser ? "text-violet-300" : "text-white"}`}>
                          {entry.pseudo}
                        </p>
                        {entry.isCurrentUser && (
                          <span className="text-[8px] px-1.5 py-0.5 rounded-full bg-violet-500/20 text-violet-400 font-bold flex-shrink-0">Vous</span>
                        )}
                      </div>
                      <p className={`text-[9px] font-semibold ${entry.badgeColor}`}>{entry.badge}</p>
                    </div>

                    {/* XP + Rank change */}
                    <div className="text-right flex-shrink-0">
                      <p className="text-xs font-black text-white">{entry.xp.toLocaleString("fr-FR")}</p>
                      <div className="flex items-center gap-0.5 justify-end">
                        {entry.rankChange === "up" ? (
                          <><ArrowUp className="w-2.5 h-2.5 text-emerald-400" /><span className="text-[9px] text-emerald-400 font-bold">+{entry.rankDelta}</span></>
                        ) : entry.rankChange === "down" ? (
                          <><ArrowDown className="w-2.5 h-2.5 text-red-400" /><span className="text-[9px] text-red-400 font-bold">-{entry.rankDelta}</span></>
                        ) : (
                          <><Minus className="w-2.5 h-2.5 text-gray-600" /><span className="text-[9px] text-gray-600 font-bold">0</span></>
                        )}
                      </div>
                    </div>

                    {/* Level badge */}
                    <div className="w-6 h-6 rounded-lg bg-indigo-500/15 flex items-center justify-center flex-shrink-0">
                      <span className="text-[9px] font-black text-indigo-400">{entry.level}</span>
                    </div>
                  </div>
                ))}
              </div>

              <button className="mt-3 w-full flex items-center justify-center gap-1.5 py-2 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.05] text-xs text-gray-500 hover:text-gray-300 transition-all font-semibold">
                Voir le classement complet <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
        <Footer />
      </main>
    </div>
  );
}