// Subscription management for CryptoIA
// Tracks the current user's plan, subscription dates, and checks route access

import { getPlanAccess } from "./store";
import { isAdminAuthenticated } from "@/pages/AdminLogin";

const USER_PLAN_KEY = "cryptoia_user_plan";
const SUBSCRIPTION_END_KEY = "cryptoia_subscription_end";
const BILLING_PERIOD_KEY = "cryptoia_billing_period";

// Clean up stale admin auth key (moved to sessionStorage in a previous version)
if (typeof window !== "undefined") {
  localStorage.removeItem("cryptoia_admin_auth");
}

// Plan hierarchy (higher index = more access)
export const PLAN_HIERARCHY = ["free", "premium", "advanced", "pro", "elite"] as const;
export type PlanType = (typeof PLAN_HIERARCHY)[number] | "admin";
export type BillingPeriod = "monthly" | "annual";

// All plans including admin (for internal use)
export const ALL_PLANS: PlanType[] = ["free", "premium", "advanced", "pro", "elite", "admin"];

// Plans visible to regular users (excludes admin)
export const USER_VISIBLE_PLANS = PLAN_HIERARCHY;

// ─── Subscription End Date ────────────────────────────────────────────────────

/** Get the stored subscription end date (ISO string or null) */
export function getSubscriptionEnd(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(SUBSCRIPTION_END_KEY);
}

/** Set the subscription end date */
export function setSubscriptionEnd(dateISO: string): void {
  localStorage.setItem(SUBSCRIPTION_END_KEY, dateISO);
}

/** Get the stored billing period */
export function getBillingPeriod(): BillingPeriod {
  const val = localStorage.getItem(BILLING_PERIOD_KEY);
  return val === "annual" ? "annual" : "monthly";
}

/** Set the billing period */
export function setBillingPeriod(period: BillingPeriod): void {
  localStorage.setItem(BILLING_PERIOD_KEY, period);
}

/** Check if the current subscription is expired */
export function isSubscriptionExpired(): boolean {
  const endStr = getSubscriptionEnd();
  if (!endStr) return false; // No end date = no expiry (free plan or legacy)
  const end = new Date(endStr);
  return end < new Date();
}

/** Get days remaining in subscription (-1 if no end date) */
export function getDaysRemaining(): number {
  const endStr = getSubscriptionEnd();
  if (!endStr) return -1;
  const end = new Date(endStr);
  const now = new Date();
  const diff = end.getTime() - now.getTime();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

/** Calculate subscription end date based on billing period */
export function calculateSubscriptionEnd(billingPeriod: BillingPeriod): string {
  const now = new Date();
  if (billingPeriod === "annual") {
    now.setFullYear(now.getFullYear() + 1);
  } else {
    now.setMonth(now.getMonth() + 1);
  }
  return now.toISOString().split("T")[0];
}

// ─── Plan Management ──────────────────────────────────────────────────────────

// Get current user plan from localStorage
// If admin is authenticated, always return "admin"
// If subscription is expired, revert to "free"
export function getUserPlan(): PlanType {
  if (isAdminAuthenticated()) {
    return "admin";
  }
  const plan = localStorage.getItem(USER_PLAN_KEY);
  if (plan && ALL_PLANS.includes(plan as PlanType)) {
    // Check if subscription has expired (only for paid plans)
    if (plan !== "free" && plan !== "admin" && isSubscriptionExpired()) {
      // Auto-revert to free on expiry
      localStorage.setItem(USER_PLAN_KEY, "free");
      return "free";
    }
    return plan as PlanType;
  }
  return "free";
}

// Set current user plan — called after successful payment verification
export function setUserPlan(plan: PlanType): void {
  localStorage.setItem(USER_PLAN_KEY, plan);
}

/**
 * Activate a subscription after successful payment.
 * Sets plan, billing period, and calculates end date.
 */
export function activateSubscription(
  plan: PlanType,
  billingPeriod: BillingPeriod = "monthly",
  endDate?: string
): void {
  setUserPlan(plan);
  setBillingPeriod(billingPeriod);
  const end = endDate || calculateSubscriptionEnd(billingPeriod);
  setSubscriptionEnd(end);

  // Also update the dev-mode user API if available
  try {
    fetch("/api/users/update-plan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        plan,
        billing_period: billingPeriod,
        subscription_end: end,
      }),
    }).catch(() => {
      // Silently fail — dev API may not be available in production
    });
  } catch {
    // Ignore
  }
}

// Clear user plan (logout / reset)
export function clearUserPlan(): void {
  localStorage.removeItem(USER_PLAN_KEY);
  localStorage.removeItem(SUBSCRIPTION_END_KEY);
  localStorage.removeItem(BILLING_PERIOD_KEY);
}

/** Get full subscription info for display */
export function getSubscriptionInfo() {
  const plan = getUserPlan();
  const endDate = getSubscriptionEnd();
  const billingPeriod = getBillingPeriod();
  const daysRemaining = getDaysRemaining();
  const expired = isSubscriptionExpired();

  return {
    plan,
    endDate,
    billingPeriod,
    daysRemaining,
    expired,
    isActive: plan !== "free" && plan !== "admin" && !expired,
    isFree: plan === "free",
    isAdmin: plan === "admin",
  };
}

// Route path to plan access slug mapping
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
  "/scalp": "strategie",
  "/risk-management": "strategie",
  "/watchlist": "strategie",
  "/graphiques": "strategie",
  "/backtesting": "strategie",
  "/portfolio-tracker": "portfolio",
  "/timeframe-analysis": "technical-analyzer",
  "/ai-assistant": "ai-coach",
  "/prediction-ia": "ai-signals",
  "/crypto-ia": "ai-signals",
  "/crypto-journal": "strategie",
  "/screener-technique": "ai-signals",
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
  "/my-cryptoia": "ai-coach",
  "/alertes-ia": "ai-signals",
  "/score-confiance-ia": "ai-signals",
  "/simulateur-strategie-ia": "setup-builder",
  "/assistant-ia": "ai-coach",
  "/gamification": "gamification",
  "/backtesting-visuel": "backtesting-visuel",
  "/rapport-hebdomadaire-ia": "ai-coach",
  "/success-stories": "dashboard",
  "/onchain-metrics": "onchain",
  "/defi-yield": "defi-yield",
  "/dtrading-ia-pro": "dtrading-ia-pro",
  "/predictions": "dashboard",
  "/trading-academy": "academy",
  "/telechargement": "downloads",
  "/contact": "dashboard",
  "/abonnements": "dashboard",
  "/mon-compte": "dashboard",
  "/payment-success": "dashboard",
};

// Check if a route is accessible for a given plan
export function isRouteAccessible(routePath: string, plan?: PlanType): boolean {
  const currentPlan = plan || getUserPlan();

  // Admin has access to EVERYTHING
  if (currentPlan === "admin") return true;

  const slug = ROUTE_TO_SLUG[routePath];

  // If route is not mapped, default to BLOCKED (secure by default)
  if (!slug) return false;

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
    admin: { label: "Admin", color: "text-red-400", gradient: "from-red-500 to-rose-600" },
  };
  return info[plan];
}