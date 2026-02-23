// CryptoIA Admin API Service
// Uses localStorage for persistence via store.ts

import * as store from "./store";

// ============================================================
// Types (re-exported for compatibility)
// ============================================================
export interface User {
  username: string;
  email?: string;
  password?: string;
  role: string;
  plan: string;
  subscription_end?: string;
  created_at?: string;
}

export interface PromoCode {
  code: string;
  discount: number;
  type: string;
  max_uses: number;
  current_uses: number;
  active: boolean;
  created_at?: string;
  expires_at?: string;
}

export interface ContactMessage {
  id: number;
  name: string;
  email: string;
  subject: string;
  message: string;
  created_at: string;
  read: boolean;
}

export interface Ebook {
  id: number;
  title: string;
  description: string;
  file_path: string;
  plan_required: string;
  active: boolean;
  downloads: number;
  created_at: string;
  category?: string;
  format?: string;
  size?: string;
}

export interface PlanPrices {
  premium: number;
  advanced: number;
  pro: number;
  elite: number;
}

export interface DashboardStats {
  total_users: number;
  active_subscriptions: number;
  total_revenue: number;
  conversion_rate: number;
  new_users_today: number;
  expiring_soon: number;
  plan_distribution: { plan: string; count: number; color: string }[];
  recent_activity: { action: string; user: string; time: string; type: string }[];
  revenue_chart: { month: string; revenue: number }[];
}

export interface RetentionData {
  success: boolean;
  red_zone: User[];
  orange_zone: User[];
  yellow_zone: User[];
}

export interface ConversionFunnel {
  success: boolean;
  steps: { name: string; count: number; rate: number }[];
}

export interface RevenueIntelligence {
  success: boolean;
  stats: { total_referrals: number; paid_referrals: number; revenue_generated: string };
  leaderboard: { username: string; referrals: number; paid: number; revenue: number }[];
  sources: { name: string; count: number }[];
}

// ============================================================
// Users — Server-side API calls (NO localStorage fallbacks)
// ============================================================
export const getUsers = async (): Promise<{ users: User[] }> => {
  try {
    const res = await fetch("/api/users");
    if (res.ok) {
      return await res.json();
    }
    console.error("[getUsers] Server responded with status:", res.status, await res.text());
    return { users: [] };
  } catch (err) {
    console.error("[getUsers] Server unreachable:", err);
    return { users: [] };
  }
};

export const addUser = async (data: {
  username: string;
  password?: string;
  role: string;
  plan: string;
}): Promise<{ success: boolean; message?: string; temp_password?: string }> => {
  try {
    const res = await fetch("/api/users/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (res.ok) {
      return await res.json();
    }
    console.error("[addUser] Server responded with status:", res.status, await res.text());
    return { success: false, message: `Erreur serveur (${res.status}). Veuillez réessayer.` };
  } catch (err) {
    console.error("[addUser] Server unreachable:", err);
    return { success: false, message: "Erreur serveur. Impossible de créer l'utilisateur. Veuillez réessayer." };
  }
};

export const updateUserPlan = async (
  username: string,
  plan: string
): Promise<{ success: boolean; message?: string; subscription_end?: string }> => {
  try {
    const res = await fetch(`/api/users/${encodeURIComponent(username)}/plan`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan }),
    });
    if (res.ok) {
      return await res.json();
    }
    console.error("[updateUserPlan] Server responded with status:", res.status, await res.text());
    return { success: false, message: `Erreur serveur (${res.status}). Veuillez réessayer.` };
  } catch (err) {
    console.error("[updateUserPlan] Server unreachable:", err);
    return { success: false, message: "Erreur serveur. Impossible de mettre à jour le plan. Veuillez réessayer." };
  }
};

export const deleteUser = async (
  username: string
): Promise<{ success: boolean; message?: string }> => {
  try {
    const res = await fetch(`/api/users/${encodeURIComponent(username)}`, {
      method: "DELETE",
    });
    if (res.ok) {
      return await res.json();
    }
    console.error("[deleteUser] Server responded with status:", res.status, await res.text());
    return { success: false, message: `Erreur serveur (${res.status}). Veuillez réessayer.` };
  } catch (err) {
    console.error("[deleteUser] Server unreachable:", err);
    return { success: false, message: "Erreur serveur. Impossible de supprimer l'utilisateur. Veuillez réessayer." };
  }
};

export const resetPassword = async (
  username: string,
  newPassword?: string
): Promise<{ success: boolean; temp_password?: string; message?: string }> => {
  try {
    const res = await fetch("/api/users/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, newPassword }),
    });
    if (res.ok) {
      return await res.json();
    }
    console.error("[resetPassword] Server responded with status:", res.status, await res.text());
    return { success: false, message: `Erreur serveur (${res.status}). Veuillez réessayer.` };
  } catch (err) {
    console.error("[resetPassword] Server unreachable:", err);
    return { success: false, message: "Erreur serveur. Impossible de réinitialiser le mot de passe. Veuillez réessayer." };
  }
};

// ============================================================
// Pricing — fetches from backend API, localStorage as fallback
// ============================================================

/** Cached pricing to avoid redundant API calls within the same page load */
let _pricingCache: { monthly: PlanPrices; annual: PlanPrices; annual_discount: number } | null = null;

async function _fetchPricingFromServer(): Promise<{ monthly: PlanPrices; annual: PlanPrices; annual_discount: number } | null> {
  try {
    const res = await fetch("/api/v1/pricing");
    if (res.ok) {
      const data = await res.json();
      _pricingCache = {
        monthly: data.monthly,
        annual: data.annual,
        annual_discount: data.annual_discount,
      };
      // Also update localStorage as cache for offline/fallback
      store.savePlanPrices(data.monthly);
      store.saveAnnualPlanPrices(data.annual);
      store.saveAnnualDiscount(data.annual_discount);
      return _pricingCache;
    }
    console.warn("[Pricing] Server responded with status:", res.status);
  } catch (err) {
    console.warn("[Pricing] Server unreachable, using localStorage fallback:", err);
  }
  return null;
}

export const getPlanPrices = async (): Promise<PlanPrices> => {
  if (_pricingCache) return _pricingCache.monthly;
  const server = await _fetchPricingFromServer();
  if (server) return server.monthly;
  return store.getPlanPrices();
};

export const savePlanPrices = async (
  prices: PlanPrices
): Promise<{ success: boolean }> => {
  // Save to localStorage immediately (optimistic)
  store.savePlanPrices(prices);
  // Also save to backend
  try {
    const res = await fetch("/api/v1/admin/pricing", {
      method: "PUT",
      headers: { "Content-Type": "application/json", "X-Admin-Auth": "true" },
      body: JSON.stringify({ monthly: prices }),
    });
    if (res.ok) {
      _pricingCache = null; // invalidate cache
      return { success: true };
    }
    console.error("[savePlanPrices] Server responded with status:", res.status);
  } catch (err) {
    console.error("[savePlanPrices] Server unreachable:", err);
  }
  return { success: true }; // localStorage save succeeded
};

export const getAnnualPlanPrices = async (): Promise<PlanPrices> => {
  if (_pricingCache) return _pricingCache.annual;
  const server = await _fetchPricingFromServer();
  if (server) return server.annual;
  return store.getAnnualPlanPrices();
};

export const saveAnnualPlanPrices = async (
  prices: PlanPrices
): Promise<{ success: boolean }> => {
  store.saveAnnualPlanPrices(prices);
  try {
    const res = await fetch("/api/v1/admin/pricing", {
      method: "PUT",
      headers: { "Content-Type": "application/json", "X-Admin-Auth": "true" },
      body: JSON.stringify({ annual: prices }),
    });
    if (res.ok) {
      _pricingCache = null;
      return { success: true };
    }
    console.error("[saveAnnualPlanPrices] Server responded with status:", res.status);
  } catch (err) {
    console.error("[saveAnnualPlanPrices] Server unreachable:", err);
  }
  return { success: true };
};

export const getAnnualDiscount = async (): Promise<number> => {
  if (_pricingCache) return _pricingCache.annual_discount;
  const server = await _fetchPricingFromServer();
  if (server) return server.annual_discount;
  return store.getAnnualDiscount();
};

export const saveAnnualDiscount = async (
  discount: number
): Promise<{ success: boolean }> => {
  store.saveAnnualDiscount(discount);
  try {
    const res = await fetch("/api/v1/admin/pricing", {
      method: "PUT",
      headers: { "Content-Type": "application/json", "X-Admin-Auth": "true" },
      body: JSON.stringify({ annual_discount: discount }),
    });
    if (res.ok) {
      _pricingCache = null;
      return { success: true };
    }
    console.error("[saveAnnualDiscount] Server responded with status:", res.status);
  } catch (err) {
    console.error("[saveAnnualDiscount] Server unreachable:", err);
  }
  return { success: true };
};

export const getPlanAccess = async (
  plan: string
): Promise<{ allowed: string[] }> => {
  return { allowed: store.getPlanAccess(plan) };
};

export const savePlanAccess = async (
  plan: string,
  routes: string[]
): Promise<{ success: boolean }> => {
  store.savePlanAccess(plan, routes);
  return { success: true };
};

// ============================================================
// Promos
// ============================================================
export const getPromos = async (): Promise<{
  success: boolean;
  promos: PromoCode[];
}> => {
  return { success: true, promos: store.getPromos() };
};

export const deletePromoApi = async (
  code: string
): Promise<{ success: boolean }> => {
  const ok = store.deletePromo(code);
  return { success: ok };
};
// Keep backward compat name
export const deletePromo = deletePromoApi;

export const createPromo = async (data: {
  code: string;
  discount: number;
  type: string;
  max_uses: number;
  expires_at?: string;
}): Promise<{ success: boolean }> => {
  store.addPromo({
    ...data,
    current_uses: 0,
    active: true,
    created_at: new Date().toISOString().split("T")[0],
  });
  return { success: true };
};

export const togglePromo = async (code: string): Promise<{ success: boolean }> => {
  const ok = store.togglePromo(code);
  return { success: ok };
};

export const validatePromo = async (code: string): Promise<{ valid: boolean; discount: number; type: string; message: string }> => {
  return store.validatePromo(code);
};

export const usePromoCode = async (code: string): Promise<{ success: boolean }> => {
  const ok = store.usePromoCode(code);
  return { success: ok };
};

// ============================================================
// Messages
// ============================================================
export const getMessages = async (): Promise<{
  messages: ContactMessage[];
}> => {
  return { messages: store.getMessages() };
};

export const sendContactMessage = async (data: {
  name: string;
  email: string;
  subject: string;
  message: string;
}): Promise<{ success: boolean }> => {
  store.addMessage(data);
  return { success: true };
};

export const markMessageRead = async (
  id: number
): Promise<{ success: boolean }> => {
  store.markMessageRead(id);
  return { success: true };
};

export const deleteMessage = async (
  id: number
): Promise<{ success: boolean }> => {
  const ok = store.deleteMessage(id);
  return { success: ok };
};

// ============================================================
// Ebooks
// ============================================================
export const getEbooks = async (): Promise<{ ebooks: Ebook[] }> => {
  return { ebooks: store.getEbooks() };
};

export const addEbook = async (
  data: Omit<Ebook, "id" | "created_at" | "downloads">
): Promise<{ success: boolean; ebook?: Ebook }> => {
  const ebook = store.addEbook(data);
  return { success: true, ebook };
};

export const updateEbook = async (
  id: number,
  data: Partial<Ebook>
): Promise<{ success: boolean }> => {
  const ok = store.updateEbook(id, data);
  return { success: ok };
};

export const deleteEbook = async (
  id: number
): Promise<{ success: boolean }> => {
  const ok = store.deleteEbook(id);
  return { success: ok };
};

export const incrementEbookDownloads = async (
  id: number
): Promise<{ success: boolean }> => {
  store.incrementEbookDownloads(id);
  return { success: true };
};

// ============================================================
// Analytics (mock - kept as computed/static)
// ============================================================
export const getRetention = async (): Promise<RetentionData> => {
  // Computed from real user data in localStorage
  const users = store.getUsers().filter((u) => u.plan !== "free" && u.subscription_end);
  const now = new Date();
  const red: User[] = [];
  const orange: User[] = [];
  const yellow: User[] = [];

  for (const user of users) {
    if (!user.subscription_end) continue;
    const end = new Date(user.subscription_end);
    const daysLeft = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    if (daysLeft <= 3) red.push(user);
    else if (daysLeft <= 14) orange.push(user);
    else if (daysLeft <= 30) yellow.push(user);
  }

  return { success: true, red_zone: red, orange_zone: orange, yellow_zone: yellow };
};

export const getConversionFunnel = async (): Promise<ConversionFunnel> => {
  // Computed from real user data — visitor estimates are approximations
  const users = store.getUsers();
  const total = users.length;
  const paid = users.filter((u) => u.plan !== "free").length;
  const estimatedVisitors = Math.max(total * 10, 1); // Estimation: ~10x registered users
  return {
    success: true,
    steps: [
      { name: "Visiteurs (estimé)", count: estimatedVisitors, rate: 100 },
      { name: "Inscrits", count: total, rate: total > 0 ? Math.round((total / estimatedVisitors) * 1000) / 10 : 0 },
      { name: "Essai gratuit", count: Math.max(total - paid, 0), rate: total > 0 ? Math.round(((total - paid) / total) * 1000) / 10 : 0 },
      { name: "Abonnés payants", count: paid, rate: total > 0 ? Math.round((paid / total) * 1000) / 10 : 0 },
    ],
  };
};

export const getRevenueIntelligence = async (): Promise<RevenueIntelligence> => {
  const refData = store.getAllReferralLeaderboard();

  return {
    success: true,
    stats: {
      total_referrals: refData.totalReferrals,
      paid_referrals: refData.paidReferrals,
      revenue_generated: `$${refData.totalRevenue.toFixed(2)} CAD`,
    },
    leaderboard: refData.leaderboard,
    sources: [
      { name: "Lien direct", count: Math.ceil(refData.totalReferrals * 0.4) || 0 },
      { name: "Facebook", count: Math.ceil(refData.totalReferrals * 0.25) || 0 },
      { name: "WhatsApp", count: Math.ceil(refData.totalReferrals * 0.15) || 0 },
      { name: "Telegram", count: Math.ceil(refData.totalReferrals * 0.12) || 0 },
      { name: "X (Twitter)", count: Math.ceil(refData.totalReferrals * 0.08) || 0 },
    ].filter((s) => s.count > 0),
  };
};

// ============================================================
// Dashboard Stats (computed from localStorage)
// ============================================================
export const getDashboardStats = async (): Promise<DashboardStats> => {
  const stats = store.getDashboardStats();
  return {
    total_users: stats.totalUsers,
    active_subscriptions: stats.activeSubscriptions,
    total_revenue: stats.totalRevenue,
    conversion_rate: stats.conversionRate,
    new_users_today: 0,
    expiring_soon: 0,
    plan_distribution: stats.planDistribution,
    recent_activity: [],
    revenue_chart: [
      { month: "Sep", revenue: stats.totalRevenue * 0.64 },
      { month: "Oct", revenue: stats.totalRevenue * 0.75 },
      { month: "Nov", revenue: stats.totalRevenue * 0.7 },
      { month: "Déc", revenue: stats.totalRevenue * 0.85 },
      { month: "Jan", revenue: stats.totalRevenue * 0.92 },
      { month: "Fév", revenue: stats.totalRevenue },
    ],
  };
};