// Subscription management for CryptoIA
// Tracks the current user's plan and checks route access

import { getPlanAccess } from "./store";

const USER_PLAN_KEY = "cryptoia_user_plan";

// Plan hierarchy (higher index = more access)
export const PLAN_HIERARCHY = ["free", "premium", "advanced", "pro", "elite"] as const;
export type PlanType = (typeof PLAN_HIERARCHY)[number];

// Get current user plan from localStorage
export function getUserPlan(): PlanType {
  const plan = localStorage.getItem(USER_PLAN_KEY);
  if (plan && PLAN_HIERARCHY.includes(plan as PlanType)) {
    return plan as PlanType;
  }
  return "free";
}

// Set current user plan
export function setUserPlan(plan: PlanType): void {
  localStorage.setItem(USER_PLAN_KEY, plan);
}

// Route path to plan access slug mapping
// Maps actual route paths to the slugs used in DEFAULT_PLAN_ACCESS
const ROUTE_TO_SLUG: Record<string, string> = {
  "/": "dashboard",
  "/fear-greed": "fear-greed",
  "/dominance": "dominance",
  "/altcoin-season": "altcoin-season",
  "/heatmap": "heatmap",
  "/bullrun-phase": "bullrun",
  "/market-regime": "ai-market-regime",
  "/strategy": "strategie",
  "/spot-trading": "strategie",
  "/calculatrice": "calculatrice",
  "/trades": "strategie",
  "/risk-management": "strategie",
  "/watchlist": "strategie",
  "/graphiques": "strategie",
  "/backtesting": "strategie",
  "/portfolio-tracker": "portfolio",
  "/timeframe-analysis": "technical-analyzer",
  "/ai-assistant": "ai-coach",
  "/prediction-ia": "ai-signals",
  "/token-scanner": "token-scanner",
  "/opportunity-scanner": "ai-signals",
  "/whale-watcher": "ai-whale-tracker",
  "/technical-analysis": "technical-analyzer",
  "/gem-hunter": "crypto-pepites",
  "/ai-signals": "ai-signals",
  "/ai-patterns": "ai-signals",
  "/ai-sentiment": "ai-news-analyzer",
  "/position-sizer": "strategie",
  "/ai-setup-builder": "setup-builder",
  "/narrative-radar": "narrative-radar",
  "/pepites-crypto": "crypto-pepites",
  "/rug-scam-shield": "scam-shield",
  "/stats-avancees": "strategie",
  "/simulation": "market-simulation",
  "/convertisseur": "convertisseur",
  "/calendrier": "calendrier",
  "/news": "nouvelles",
  "/success-stories": "dashboard",
  "/onchain-metrics": "onchain",
  "/defi-yield": "defi-yield",
  "/trading-academy": "academy",
  "/telechargement": "downloads",
  "/contact": "dashboard",
  "/abonnements": "dashboard",
  "/mon-compte": "dashboard",
};

// Check if a route is accessible for a given plan
export function isRouteAccessible(routePath: string, plan?: PlanType): boolean {
  const currentPlan = plan || getUserPlan();
  const slug = ROUTE_TO_SLUG[routePath];

  // If route is not mapped, allow access (e.g., admin routes, contact, etc.)
  if (!slug) return true;

  // Dashboard and basic routes always accessible
  if (slug === "dashboard") return true;

  const allowedSlugs = getPlanAccess(currentPlan);
  return allowedSlugs.includes(slug);
}

// Get the minimum plan required for a route
export function getMinimumPlanForRoute(routePath: string): PlanType {
  const slug = ROUTE_TO_SLUG[routePath];
  if (!slug || slug === "dashboard") return "free";

  // Check each plan from lowest to highest
  for (const plan of PLAN_HIERARCHY) {
    const allowedSlugs = getPlanAccess(plan);
    if (allowedSlugs.includes(slug)) {
      return plan;
    }
  }
  return "elite";
}

// Get plan display info
export function getPlanDisplayInfo(plan: PlanType) {
  const info: Record<PlanType, { label: string; color: string; gradient: string }> = {
    free: { label: "Gratuit", color: "text-gray-400", gradient: "from-gray-500 to-gray-600" },
    premium: { label: "Premium", color: "text-blue-400", gradient: "from-blue-500 to-indigo-600" },
    advanced: { label: "Advanced", color: "text-purple-400", gradient: "from-purple-500 to-purple-600" },
    pro: { label: "Pro", color: "text-amber-400", gradient: "from-amber-500 to-orange-600" },
    elite: { label: "Elite", color: "text-emerald-400", gradient: "from-emerald-500 to-emerald-600" },
  };
  return info[plan];
}