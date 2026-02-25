import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { getUserPlan, isRouteAccessible, getMinimumPlanForRoute, getPlanDisplayInfo } from "@/lib/subscription";
import { getUserSession, clearUserSession } from "@/lib/store";
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
  Bell,
  FileText,
  Trophy,
  Menu,
  X,
  Send,
  Zap,
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
      { path: "/my-cryptoia", label: "My CryptoIA", icon: User },
      { path: "/gamification", label: "Gamification & Badges", icon: Trophy },
    ],
  },
  {
    title: "Marché",
    items: [
      { path: "/fear-greed", label: "Fear & Greed", icon: Frown },
      { path: "/dominance", label: "Dominance", icon: Crown },
      { path: "/altcoin-season", label: "Altcoin Season", icon: Star },
      { path: "/heatmap", label: "Heatmap", icon: Flame },
      { path: "/bullrun-phase", label: "Bullrun Phase", icon: Rocket },
      { path: "/market-regime", label: "Market Regime", icon: Activity },
    ],
  },
  {
    title: "IA & Analyse",
    items: [
      { path: "/alertes-ia", label: "Alertes IA", icon: Bell },
      { path: "/score-confiance-ia", label: "Score Confiance IA", icon: Shield },
      { path: "/simulateur-strategie-ia", label: "Simulateur Stratégie IA", icon: Target },
      { path: "/rapport-hebdomadaire-ia", label: "Rapport Hebdomadaire IA", icon: FileText },
      { path: "/backtesting-visuel", label: "Backtesting Visuel IA", icon: Activity },
      { path: "/predictions", label: "Prédictions Crypto", icon: BarChart3 },
      { path: "/prediction-ia", label: "Prédiction IA", icon: Sparkles },
      { path: "/crypto-ia", label: "Crypto IA", icon: Bot },
      { path: "/token-scanner", label: "AI Token Scanner", icon: Search },
      { path: "/opportunity-scanner", label: "Scanner Opportunités", icon: Scan },
      { path: "/whale-watcher", label: "Whale Watcher", icon: Fish },
      { path: "/technical-analysis", label: "Analyse Technique", icon: PieChart },
      { path: "/gem-hunter", label: "Gem Hunter", icon: Gem },
      { path: "/ai-signals", label: "AI Signals", icon: Radio },
      { path: "/ai-patterns", label: "Patterns IA", icon: Brain },
      { path: "/ai-sentiment", label: "Sentiment IA", icon: MessageCircle },
      { path: "/position-sizer", label: "Position Sizer", icon: Crosshair },
      { path: "/ai-setup-builder", label: "AI Setup Builder", icon: Wrench },
      { path: "/narrative-radar", label: "Narrative Radar", icon: Target },
      { path: "/pepites-crypto", label: "Pépites Crypto", icon: Diamond },
      { path: "/rug-scam-shield", label: "Rug Shield", icon: ShieldAlert },
    ],
  },
  {
    title: "Trading",
    items: [
      { path: "/strategy", label: "Stratégie", icon: BarChart3 },
      { path: "/spot-trading", label: "Spot Trading", icon: Gem },
      { path: "/calculatrice", label: "Calculatrice", icon: Calculator },
      { path: "/trades", label: "Swing Trading", icon: TrendingUp },
      { path: "/scalp", label: "Scalp Trading", icon: Zap },
      { path: "/risk-management", label: "Risk Management", icon: AlertTriangle },
      { path: "/watchlist", label: "Watchlist", icon: Eye },
      { path: "/graphiques", label: "Graphiques", icon: LineChart },
      { path: "/backtesting", label: "Backtesting", icon: History },
      { path: "/portfolio-tracker", label: "Portfolio", icon: Briefcase },
      { path: "/timeframe-analysis", label: "Timeframe Analysis", icon: Clock },
      { path: "/crypto-journal", label: "Journal de Trading", icon: BookOpen },
      { path: "/screener-technique", label: "Screener Technique", icon: SlidersHorizontal },
      { path: "/dtrading-ia-pro", label: "Dtrading IA PRO", icon: Crosshair },
    ],
  },
  {
    title: "Assistant",
    items: [
      { path: "/assistant-ia", label: "Assistant IA Conversationnel", icon: Bot },
    ],
  },
  {
    title: "Outils",
    items: [
      { path: "/stats-avancees", label: "Stats Avancées", icon: BarChart3 },
      { path: "/simulation", label: "Simulation", icon: Gamepad2 },
      { path: "/convertisseur", label: "Convertisseur", icon: ArrowLeftRight },
      { path: "/calendrier", label: "Calendrier", icon: Calendar },
      { path: "/news", label: "Nouvelles", icon: Newspaper },
      { path: "/success-stories", label: "Success Stories", icon: Award },
      { path: "/onchain-metrics", label: "On-Chain", icon: LinkIcon },
      { path: "/defi-yield", label: "DeFi Yield", icon: Landmark },
      { path: "/trading-academy", label: "Trading Academy", icon: GraduationCap },
      { path: "/telechargement", label: "Téléchargements", icon: Download },
      { path: "/contact", label: "Contact", icon: Mail },
    ],
  },
];

const BOTTOM_ITEMS = [
  { path: "/abonnements", label: "Abonnements", icon: CreditCard, color: "indigo" },
  { path: "/admin", label: "Admin Panel", icon: Shield, color: "amber" },
  { path: "/mon-compte", label: "Mon Compte", icon: User, color: "emerald" },
];

// Mobile top bar shown only on small screens
export function MobileTopBar({ onOpen }: { onOpen: () => void }) {
  return (
    <div className="md:hidden fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-4 h-14 bg-[#0A0E1A]/95 backdrop-blur-xl border-b border-white/[0.06]">
      <div className="flex items-center gap-2">
        <img src="/assets/logo1.png" alt="CryptoIA" className="w-8 h-8 rounded-xl object-contain" />
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
    };
    return map[color] || "";
  };

  const getBottomIconColor = (color: string, active: boolean) => {
    if (!active) return "bg-white/[0.04] text-gray-500 group-hover:text-gray-300 group-hover:bg-white/[0.06]";
    const map: Record<string, string> = {
      indigo: "bg-indigo-500/20 text-indigo-400",
      amber: "bg-amber-500/20 text-amber-400",
      emerald: "bg-emerald-500/20 text-emerald-400",
    };
    return map[color] || "";
  };

  const getBottomBarColor = (color: string) => {
    const map: Record<string, string> = {
      indigo: "from-indigo-400 to-blue-500",
      amber: "from-amber-400 to-orange-500",
      emerald: "from-emerald-400 to-green-500",
    };
    return map[color] || "from-indigo-400 to-purple-500";
  };

  const sidebarContent = (isMobile = false) => (
    <>
      {/* Logo */}
      <div className="flex items-center justify-between px-5 h-16 border-b border-white/[0.06] flex-shrink-0">
        <div className="flex items-center gap-3">
          <img src="https://mgx-backend-cdn.metadl.com/generate/images/966405/2026-02-19/4ee17351-fcfd-422c-8a4f-5e9829ba23a7.png" alt="CryptoIA" className="w-9 h-9 rounded-xl object-contain flex-shrink-0" />
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
            <span className="text-[10px] text-gray-500 font-semibold">Plan:</span>
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
                {section.title}
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
                        {item.label}
                      </span>
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
            Compte
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
                  {item.label}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Login / Logout Button */}
      <div className="px-3 pb-2 flex-shrink-0">
        {userSession ? (
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 transition-all text-xs font-semibold border border-red-500/10"
            title="Se déconnecter"
          >
            <LogOut className="w-3.5 h-3.5 flex-shrink-0" />
            {(!collapsed || isMobile) && <span>Déconnexion ({userSession.username})</span>}
          </button>
        ) : (
          <Link
            to="/login"
            className="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 hover:text-indigo-300 transition-all text-xs font-semibold border border-indigo-500/10"
            title="Se connecter"
          >
            <LogIn className="w-3.5 h-3.5 flex-shrink-0" />
            {(!collapsed || isMobile) && <span>Se connecter</span>}
          </Link>
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
                <span>Réduire</span>
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