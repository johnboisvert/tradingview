import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { getUserPlan, isRouteAccessible, getMinimumPlanForRoute, getPlanDisplayInfo } from "@/lib/subscription";
import { getUserSession, clearUserSession } from "@/lib/store";
import AnimatedLogo from "@/components/AnimatedLogo";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import PushSubscribeButton from "@/components/PushSubscribeButton";
import {
  LayoutDashboard,
  Frown,
  Crown,
  Star,
  Flame,
  BarChart3,
  Gem,
  Calculator,
  Newspaper,
  TrendingUp,
  AlertTriangle,
  Eye,
  Bot,
  Sparkles,
  Search,
  Activity,
  Fish,
  PieChart,
  Gamepad2,
  Award,
  ArrowLeftRight,
  Calendar,
  Rocket,
  LineChart,
  CreditCard,
  Shield,
  User,
  ChevronLeft,
  ChevronRight,
  Radio,
  Briefcase,
  Link as LinkIcon,
  Landmark,
  Target,
  ShieldAlert,
  Mail,
  History,
  Scan,
  Brain,
  MessageCircle,
  Clock,
  Wrench,
  Diamond,
  GraduationCap,
  Download,
  LogIn,
  LogOut,
  Crosshair,
  Lock,
  BookOpen,
  SlidersHorizontal,
  Scale,
  Coins,
  Library,
  Bell,
  FileText,
  Trophy,
  Menu,
  X,
  Send,
  Zap,
  Users,
  Gift,
  Terminal as TerminalIcon,
} from "lucide-react";

const NAV_SECTIONS = [
  {
    title: "Accueil",
    items: [
      { path: "/", label: "Dashboard", icon: LayoutDashboard },
    ],
  },
  {
    title: "Mon Espace",
    items: [
      { path: "/terminal", label: "Terminal Pro", icon: TerminalIcon, badge: "ELITE" },
      { path: "/my-cryptoia", label: "My CryptoIA", icon: User },
      { path: "/gamification", label: "Gamification & Badges", icon: Trophy },
      { path: "/challenge", label: "Trading Challenge", icon: Trophy, badge: "NEW" },
      { path: "/portfolio-tracker", label: "Portfolio", icon: Briefcase },
      { path: "/watchlist", label: "Watchlist", icon: Eye },
      { path: "/crypto-journal", label: "Journal de Trading", icon: BookOpen },
      { path: "/alertes-ia", label: "Alertes IA", icon: Bell },
    ],
  },
  {
    title: "Marché",
    items: [
      { path: "/heatmap", label: "Heatmap", icon: Flame },
      { path: "/fear-greed", label: "Fear & Greed", icon: Frown },
      { path: "/dominance", label: "Dominance", icon: Crown },
      { path: "/altcoin-season", label: "Altcoin Season", icon: Star },
      { path: "/bullrun-phase", label: "Bullrun Phase", icon: Rocket },
      { path: "/market-regime", label: "Market Regime", icon: Activity },
      { path: "/onchain-metrics", label: "On-Chain", icon: LinkIcon },
      { path: "/defi-yield", label: "DeFi Yield", icon: Landmark },
    ],
  },
  {
    title: "Signaux IA",
    items: [
      { path: "/ai-signals", label: "AI Signals", icon: Radio },
      { path: "/ai-sentiment", label: "Sentiment IA", icon: MessageCircle },
      { path: "/ai-patterns", label: "Patterns IA", icon: Brain },
      { path: "/whale-watcher", label: "Whale Watcher", icon: Fish },
      { path: "/gem-hunter", label: "Gem Hunter", icon: Gem },
      { path: "/pepites-crypto", label: "Pépites Crypto", icon: Diamond },
      { path: "/narrative-radar", label: "Narrative Radar", icon: Target },
      { path: "/token-scanner", label: "AI Token Scanner", icon: Search },
      { path: "/opportunity-scanner", label: "Scanner Opportunités", icon: Scan },
      { path: "/crypto-ia", label: "Crypto IA", icon: Bot },
      { path: "/rug-scam-shield", label: "Rug Shield", icon: ShieldAlert },
    ],
  },
  {
    title: "Prédictions & Stratégies IA",
    items: [
      { path: "/prediction-ia", label: "Prédiction IA", icon: Sparkles },
      { path: "/predictions", label: "Prédictions Crypto", icon: BarChart3 },
      { path: "/score-confiance-ia", label: "Score Confiance IA", icon: Shield },
      { path: "/rapport-hebdomadaire-ia", label: "Rapport Hebdo IA", icon: FileText },
      { path: "/simulateur-strategie-ia", label: "Simulateur Stratégie IA", icon: Target },
      { path: "/backtesting-visuel", label: "Backtesting Visuel IA", icon: Activity },
      { path: "/ai-setup-builder", label: "AI Setup Builder", icon: Wrench },
      { path: "/technical-analysis", label: "Analyse Technique", icon: PieChart },
    ],
  },
  {
    title: "Trading",
    items: [
      { path: "/strategy", label: "Stratégie", icon: BarChart3 },
      { path: "/spot-trading", label: "Spot Trading", icon: Gem },
      { path: "/trades", label: "Swing Trading", icon: TrendingUp },
      { path: "/scalp", label: "Scalp Trading", icon: Zap },
      { path: "/range", label: "Range Trading", icon: BarChart3 },
      { path: "/dtrading-ia-pro", label: "Dtrading IA PRO", icon: Crosshair },
      { path: "/screener-technique", label: "Screener Technique", icon: SlidersHorizontal },
      { path: "/position-sizer", label: "Position Sizer", icon: Crosshair },
      { path: "/risk-management", label: "Risk Management", icon: AlertTriangle },
      { path: "/calculatrice", label: "Calculatrice", icon: Calculator },
      { path: "/graphiques", label: "Graphiques", icon: LineChart },
      { path: "/timeframe-analysis", label: "Timeframe Analysis", icon: Clock },
    ],
  },
  {
    title: "Assistant",
    items: [
      { path: "/assistant-ia", label: "Assistant IA", icon: Bot },
    ],
  },
  {
    title: "Ressources",
    items: [
      { path: "/blog", label: "Blog 📝", icon: BookOpen, badge: "NEW" },
      { path: "/trading-academy", label: "Trading Academy", icon: GraduationCap },
      { path: "/news", label: "Nouvelles", icon: Newspaper },
      { path: "/lexique", label: "Lexique Crypto", icon: Library, badge: "NEW" },
      { path: "/compare", label: "Comparatifs", icon: Scale, badge: "NEW" },
      { path: "/crypto", label: "Cryptos (Cours & Fiches)", icon: Coins, badge: "NEW" },
      { path: "/success-stories", label: "Success Stories", icon: Award },
      { path: "/leaderboard", label: "Leaderboard 🏆", icon: Crown },
      { path: "/quiz", label: "Quiz Trader 🧠", icon: Sparkles, badge: "NEW" },
    ],
  },
  {
    title: "Outils",
    items: [
      { path: "/stats-avancees", label: "Stats Avancées", icon: BarChart3 },
      { path: "/comparateur-frais-exchanges", label: "Comparateur Frais Exchanges", icon: Scale, badge: "NEW" },
      { path: "/simulation", label: "Simulation", icon: Gamepad2 },
      { path: "/convertisseur", label: "Convertisseur", icon: ArrowLeftRight },
      { path: "/calendrier", label: "Calendrier", icon: Calendar },
      { path: "/telechargement", label: "Téléchargements", icon: Download },
      { path: "/contact", label: "Contact", icon: Mail },
    ],
  },
];

const BOTTOM_ITEMS = [
  { path: "/abonnements", label: "Abonnements", icon: CreditCard, color: "indigo" },
  { path: "/parrainage", label: "Mon Parrainage 🎁", icon: Gift, color: "emerald" },
  { path: "/affiliation", label: "Affiliation 30%", icon: Users, color: "emerald" },
  { path: "/magic-strategy", label: "Indicateurs", icon: Sparkles, color: "cyan" },
  { path: "/performance", label: "Performance Signaux", icon: Trophy, color: "emerald" },
  { path: "/admin", label: "Admin Panel", icon: Shield, color: "amber" },
  { path: "/mon-compte", label: "Mon Compte", icon: User, color: "emerald" },
];

// i18n mappings — section title FR → key, path → label key
const SECTION_KEY: Record<string, string> = {
  "Accueil": "nav.sections.home",
  "Mon Espace": "nav.sections.myArea",
  "Marché": "nav.sections.market",
  "Signaux IA": "nav.sections.aiSignals",
  "Prédictions & Stratégies IA": "nav.sections.aiPredictions",
  "Trading": "nav.sections.trading",
  "Assistant": "nav.sections.assistant",
  "Ressources": "nav.sections.resources",
  "Outils": "nav.sections.tools",
};

const PATH_KEY: Record<string, string> = {
  "/": "nav.items.dashboard",
  "/my-cryptoia": "nav.items.myCryptoia",
  "/gamification": "nav.items.gamification",
  "/leaderboard": "nav.items.leaderboard",
  "/fear-greed": "nav.items.fearGreed",
  "/dominance": "nav.items.dominance",
  "/altcoin-season": "nav.items.altcoinSeason",
  "/heatmap": "nav.items.heatmap",
  "/bullrun-phase": "nav.items.bullrunPhase",
  "/market-regime": "nav.items.marketRegime",
  "/alertes-ia": "nav.items.alertesIa",
  "/score-confiance-ia": "nav.items.scoreConfianceIa",
  "/simulateur-strategie-ia": "nav.items.simulateurStrategieIa",
  "/rapport-hebdomadaire-ia": "nav.items.rapportHebdoIa",
  "/backtesting-visuel": "nav.items.backtestingVisuel",
  "/predictions": "nav.items.predictions",
  "/prediction-ia": "nav.items.predictionIa",
  "/crypto-ia": "nav.items.cryptoIa",
  "/token-scanner": "nav.items.tokenScanner",
  "/opportunity-scanner": "nav.items.opportunityScanner",
  "/whale-watcher": "nav.items.whaleWatcher",
  "/technical-analysis": "nav.items.technicalAnalysis",
  "/gem-hunter": "nav.items.gemHunter",
  "/ai-signals": "nav.items.aiSignals",
  "/ai-patterns": "nav.items.aiPatterns",
  "/ai-sentiment": "nav.items.aiSentiment",
  "/position-sizer": "nav.items.positionSizer",
  "/ai-setup-builder": "nav.items.aiSetupBuilder",
  "/narrative-radar": "nav.items.narrativeRadar",
  "/pepites-crypto": "nav.items.pepitesCrypto",
  "/rug-scam-shield": "nav.items.rugScamShield",
  "/strategy": "nav.items.strategy",
  "/spot-trading": "nav.items.spotTrading",
  "/calculatrice": "nav.items.calculatrice",
  "/trades": "nav.items.swingTrading",
  "/scalp": "nav.items.scalpTrading",
  "/range": "nav.items.rangeTrading",
  "/risk-management": "nav.items.riskManagement",
  "/watchlist": "nav.items.watchlist",
  "/graphiques": "nav.items.graphiques",
  "/portfolio-tracker": "nav.items.portfolio",
  "/timeframe-analysis": "nav.items.timeframeAnalysis",
  "/crypto-journal": "nav.items.cryptoJournal",
  "/screener-technique": "nav.items.screenerTechnique",
  "/dtrading-ia-pro": "nav.items.dtradingIaPro",
  "/assistant-ia": "nav.items.assistantConversational",
  "/stats-avancees": "nav.items.statsAvancees",
  "/simulation": "nav.items.simulation",
  "/convertisseur": "nav.items.convertisseur",
  "/calendrier": "nav.items.calendrier",
  "/news": "nav.items.news",
  "/blog": "nav.items.blog",
  "/success-stories": "nav.items.successStories",
  "/onchain-metrics": "nav.items.onchain",
  "/defi-yield": "nav.items.defiYield",
  "/trading-academy": "nav.items.tradingAcademy",
  "/telechargement": "nav.items.telechargements",
  "/contact": "nav.items.contact",
  "/abonnements": "nav.items.abonnements",
  "/affiliation": "nav.items.affiliation",
  "/magic-strategy": "nav.items.magicStrategy",
  "/admin": "nav.items.adminPanel",
  "/mon-compte": "nav.items.monCompte",
};

// Mobile top bar shown only on small screens
export function MobileTopBar({ onOpen }: { onOpen: () => void }) {
  return (
    <div className="md:hidden fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-4 h-14 bg-[#0A0E1A]/95 backdrop-blur-xl border-b border-white/[0.06]">
      <div className="flex items-center gap-2">
        <AnimatedLogo size={32} oncePerSession />
        <span className="text-base font-extrabold bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">
          CryptoIA
        </span>
      </div>
      <button
        onClick={onOpen}
        className="p-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.10] text-gray-300 hover:text-white transition-all"
        aria-label="Ouvrir le menu"
      >
        <Menu className="w-5 h-5" />
      </button>
    </div>
  );
}

export default function Sidebar() {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const currentPlan = getUserPlan();
  const userSession = getUserSession();

  // Close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  const handleLogout = () => {
    clearUserSession();
    navigate("/login");
  };

  const isActive = (path: string) =>
    location.pathname === path || (path !== "/" && location.pathname.startsWith(path));

  const getBottomColor = (color: string, active: boolean) => {
    if (!active) return "text-gray-400 hover:text-white hover:bg-white/[0.04]";
    const map: Record<string, string> = {
      indigo: "bg-gradient-to-r from-indigo-500/15 to-blue-500/10 text-white",
      amber: "bg-gradient-to-r from-amber-500/15 to-orange-500/10 text-white",
      emerald: "bg-gradient-to-r from-emerald-500/15 to-green-500/10 text-white",
      cyan: "bg-gradient-to-r from-cyan-500/15 to-emerald-500/10 text-white",
    };
    return map[color] || "";
  };

  const getBottomIconColor = (color: string, active: boolean) => {
    if (!active) return "bg-white/[0.04] text-gray-500 group-hover:text-gray-300 group-hover:bg-white/[0.06]";
    const map: Record<string, string> = {
      indigo: "bg-indigo-500/20 text-indigo-400",
      amber: "bg-amber-500/20 text-amber-400",
      emerald: "bg-emerald-500/20 text-emerald-400",
      cyan: "bg-cyan-500/20 text-cyan-400",
    };
    return map[color] || "";
  };

  const getBottomBarColor = (color: string) => {
    const map: Record<string, string> = {
      indigo: "from-indigo-400 to-blue-500",
      amber: "from-amber-400 to-orange-500",
      emerald: "from-emerald-400 to-green-500",
      cyan: "from-cyan-400 to-emerald-500",
    };
    return map[color] || "from-indigo-400 to-purple-500";
  };

  const sidebarContent = (isMobile = false) => (
    <>
      {/* Logo */}
      <div className="flex items-center justify-between px-5 h-16 border-b border-white/[0.06] flex-shrink-0">
        <div className="flex items-center gap-3">
          <AnimatedLogo size={36} className="rounded-xl" oncePerSession />
          {(!collapsed || isMobile) && (
            <div className="overflow-hidden">
              <h1 className="text-lg font-extrabold tracking-tight">
                <span className="bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">
                  CryptoIA
                </span>
              </h1>
              <p className="text-[10px] text-gray-500 font-semibold -mt-0.5">
                Trading Platform
              </p>
            </div>
          )}
        </div>
        {isMobile && (
          <button
            onClick={() => setMobileOpen(false)}
            className="p-1.5 rounded-lg bg-white/[0.06] hover:bg-white/[0.10] text-gray-400 hover:text-white transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Current Plan Badge */}
      {(!collapsed || isMobile) && (
        <div className="px-4 pt-3 pb-1">
          <Link to="/mon-compte" className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.05] transition-all">
            <div className={`w-2 h-2 rounded-full bg-gradient-to-r ${getPlanDisplayInfo(currentPlan).gradient}`} />
            <span className="text-[10px] text-gray-500 font-semibold">{t("common.plan")}:</span>
            <span className={`text-[11px] font-bold ${getPlanDisplayInfo(currentPlan).color}`}>
              {getPlanDisplayInfo(currentPlan).label}
            </span>
          </Link>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 py-3 px-3 space-y-1 overflow-y-auto scrollbar-thin scrollbar-thumb-white/10">
        {NAV_SECTIONS.map((section, si) => (
          <div key={si} className={si > 0 ? "mt-4" : ""}>
            {(!collapsed || isMobile) && (
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest px-3 mb-2">
                {t(SECTION_KEY[section.title] || section.title, { defaultValue: section.title })}
              </p>
            )}
            {collapsed && !isMobile && si > 0 && <div className="my-2 border-t border-white/[0.06]" />}
            {section.items.map((item) => {
              const active = isActive(item.path);
              const Icon = item.icon;
              const accessible = isRouteAccessible(item.path, currentPlan);
              const minPlan = !accessible ? getMinimumPlanForRoute(item.path) : null;
              const minPlanInfo = minPlan ? getPlanDisplayInfo(minPlan) : null;

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`group flex items-center gap-3 px-3 py-2 rounded-xl transition-all duration-200 relative ${
                    !accessible
                      ? "text-gray-600 hover:text-gray-500 hover:bg-white/[0.02]"
                      : active
                      ? "bg-gradient-to-r from-indigo-500/15 to-purple-500/10 text-white"
                      : "text-gray-400 hover:text-white hover:bg-white/[0.04]"
                  }`}
                >
                  {active && accessible && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-gradient-to-b from-indigo-400 to-purple-500 rounded-r-full" />
                  )}
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors ${
                      !accessible
                        ? "bg-white/[0.02] text-gray-600"
                        : active
                        ? "bg-indigo-500/20 text-indigo-400"
                        : "bg-white/[0.04] text-gray-500 group-hover:text-gray-300 group-hover:bg-white/[0.06]"
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  {(!collapsed || isMobile) && (
                    <>
                      <span className={`text-[13px] font-semibold truncate flex-1 ${
                        !accessible ? "text-gray-600" : active ? "text-white" : ""
                      }`}>
                        {t(PATH_KEY[item.path] || item.label, { defaultValue: item.label })}
                      </span>
                      {accessible && (item as { badge?: string }).badge && (
                        <span
                          data-testid={`sidebar-badge-${item.path.replace(/\//g, "-")}`}
                          aria-label={(item as { badge?: string }).badge === "NEW" ? "Nouveau" : (item as { badge?: string }).badge}
                          className={`flex-shrink-0 px-1.5 py-0.5 rounded-full text-[9px] font-black tracking-wider text-white shadow-sm ${
                            (item as { badge?: string }).badge === "ELITE"
                              ? "bg-gradient-to-r from-amber-500 to-orange-500 shadow-amber-500/30"
                              : "bg-gradient-to-r from-pink-500 to-rose-500 shadow-pink-500/30"
                          }`}
                        >
                          {(item as { badge?: string }).badge}
                        </span>
                      )}
                      {!accessible && (
                        <div className="flex items-center gap-1">
                          <Lock className="w-3 h-3 text-gray-600" />
                          {minPlanInfo && (
                            <span className={`text-[9px] font-bold ${minPlanInfo.color} opacity-70`}>
                              {minPlanInfo.label}
                            </span>
                          )}
                        </div>
                      )}
                    </>
                  )}
                  {collapsed && !isMobile && !accessible && (
                    <div className="absolute top-0.5 right-0.5">
                      <Lock className="w-2.5 h-2.5 text-gray-600" />
                    </div>
                  )}
                </Link>
              );
            })}
          </div>
        ))}

        {/* Bottom Items */}
        {(!collapsed || isMobile) && (
          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest px-3 mb-2 mt-4">
            {t("nav.sections.account")}
          </p>
        )}
        {collapsed && !isMobile && <div className="my-2 border-t border-white/[0.06]" />}
        {BOTTOM_ITEMS.map((item) => {
          const active = isActive(item.path);
          const Icon = item.icon;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`group flex items-center gap-3 px-3 py-2 rounded-xl transition-all duration-200 relative ${getBottomColor(item.color, active)}`}
            >
              {active && (
                <div className={`absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-gradient-to-b ${getBottomBarColor(item.color)} rounded-r-full`} />
              )}
              <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors ${getBottomIconColor(item.color, active)}`}>
                <Icon className="w-3.5 h-3.5" />
              </div>
              {(!collapsed || isMobile) && (
                <span className={`text-[13px] font-semibold truncate ${active ? "text-white" : ""}`}>
                  {t(PATH_KEY[item.path] || item.label, { defaultValue: item.label })}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Login / Logout Button + Tools row (lang + Cmd+K hint) */}
      <div className="px-3 pb-2 flex-shrink-0 space-y-2">
        {userSession ? (
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 transition-all text-xs font-semibold border border-red-500/10"
            title={t("common.logout")}
          >
            <LogOut className="w-3.5 h-3.5 flex-shrink-0" />
            {(!collapsed || isMobile) && <span>{t("common.logout")} ({userSession.username})</span>}
          </button>
        ) : (
          <Link
            to="/login"
            className="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 hover:text-indigo-300 transition-all text-xs font-semibold border border-indigo-500/10"
            title={t("common.login")}
          >
            <LogIn className="w-3.5 h-3.5 flex-shrink-0" />
            {(!collapsed || isMobile) && <span>{t("common.login")}</span>}
          </Link>
        )}

        {(!collapsed || isMobile) && (
          <div className="flex items-center justify-between gap-2 px-1">
            <button
              type="button"
              onClick={() => {
                const e = new KeyboardEvent("keydown", { key: "k", metaKey: true, ctrlKey: true, bubbles: true });
                window.dispatchEvent(e);
              }}
              className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-white/[0.04] hover:bg-white/[0.08] text-[10px] text-gray-400 hover:text-white transition-all"
              title={t("common.search")}
              data-testid="sidebar-cmdk-hint"
            >
              <Search className="w-3 h-3" />
              <span>{t("common.search")}</span>
              <kbd className="ml-1 px-1 py-0.5 text-[9px] font-bold bg-white/[0.08] rounded border border-white/[0.06]">⌘K</kbd>
            </button>
            <LanguageSwitcher />
          </div>
        )}
        {(!collapsed || isMobile) && (
          <div className="flex justify-center pt-1">
            <PushSubscribeButton />
          </div>
        )}
      </div>

      {/* Collapse Button - desktop only */}
      {!isMobile && (
        <div className="px-3 pb-4 flex-shrink-0">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-gray-400 hover:text-white transition-all text-xs font-semibold"
          >
            {collapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <>
                <ChevronLeft className="w-4 h-4" />
                <span>{t("nav.collapse")}</span>
              </>
            )}
          </button>
        </div>
      )}
    </>
  );

  return (
    <>
      {/* Mobile Top Bar */}
      <MobileTopBar onOpen={() => setMobileOpen(true)} />

      {/* Mobile Overlay */}
      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile Drawer */}
      <aside
        className={`md:hidden fixed left-0 top-0 bottom-0 z-50 flex flex-col w-[280px] bg-[#0A0E1A]/98 backdrop-blur-xl border-r border-white/[0.06] transition-transform duration-300 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {sidebarContent(true)}
      </aside>

      {/* Desktop Sidebar */}
      <aside
        className={`hidden md:flex fixed left-0 top-0 bottom-0 z-50 flex-col bg-[#0A0E1A]/95 backdrop-blur-xl border-r border-white/[0.06] transition-all duration-300 ${
          collapsed ? "w-[72px]" : "w-[260px]"
        }`}
      >
        {sidebarContent(false)}
      </aside>
    </>
  );
}