// CryptoIA Admin API Service
// Connects to FastAPI backend with mock data fallback

const API_BASE = import.meta.env.VITE_API_BASE_URL || "";

// ============================================================
// Helper
// ============================================================
async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  try {
    if (!API_BASE) throw new Error("No API base configured");
    const res = await fetch(`${API_BASE}${path}`, {
      credentials: "include",
      headers: { "Content-Type": "application/json", Accept: "application/json", "X-Requested-With": "XMLHttpRequest" },
      ...options,
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  } catch {
    // Return mock data when API unavailable
    return getMockData(path) as T;
  }
}

async function apiPost<T>(path: string, body: unknown): Promise<T> {
  return apiFetch<T>(path, { method: "POST", body: JSON.stringify(body) });
}

// ============================================================
// Types
// ============================================================
export interface User {
  username: string;
  email?: string;
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
// API Functions
// ============================================================

// Dashboard
export const getDashboardStats = () => apiFetch<DashboardStats>("/api/admin/dashboard-stats");

// Users
export const getUsers = () => apiFetch<{ users: User[] }>("/admin-dashboard/api/users");
export const addUser = (data: { username: string; password?: string; role: string; plan: string }) =>
  apiPost<{ success: boolean; message?: string; temp_password?: string }>("/admin/add-user", data);
export const updateUserPlan = (username: string, plan: string) =>
  apiPost<{ success: boolean; message?: string; subscription_end?: string }>("/admin/update-user-plan", { username, new_plan: plan, plan });
export const deleteUser = (username: string) =>
  apiPost<{ success: boolean; message?: string }>("/admin/delete-user", { username });
export const resetPassword = (username: string, newPassword?: string) =>
  apiPost<{ success: boolean; temp_password?: string; message?: string }>("/admin/reset-password", { username, ...(newPassword ? { new_password: newPassword } : {}) });

// Pricing
export const getPlanPrices = () => apiFetch<PlanPrices>("/admin/api/plan-prices");
export const savePlanPrices = (prices: PlanPrices) => apiPost<{ success: boolean }>("/admin/save-prices", prices);
export const getPlanAccess = (plan: string) => apiFetch<{ allowed: string[] }>(`/admin/get-plan-access/${plan}`);
export const savePlanAccess = (plan: string, routes: string[]) =>
  apiPost<{ success: boolean }>("/admin/save-plan-access", { plan, routes });

// Promos
export const getPromos = () => apiFetch<{ success: boolean; promos: PromoCode[] }>("/admin/api/list-promos");
export const deletePromo = (code: string) => apiPost<{ success: boolean }>("/admin/delete-promo", { code });
export const createPromo = (data: { code: string; discount: number; type: string; max_uses: number }) =>
  apiPost<{ success: boolean }>("/admin/create-promo", data);

// Messages
export const getMessages = () => apiFetch<{ messages: ContactMessage[] }>("/admin-dashboard/api/messages");

// Ebooks
export const getEbooks = () => apiFetch<{ ebooks: Ebook[] }>("/admin-dashboard/api/ebooks");

// Analytics
export const getRetention = () => apiFetch<RetentionData>("/admin-dashboard/api/retention-dashboard");
export const getConversionFunnel = () => apiFetch<ConversionFunnel>("/admin-dashboard/api/conversion-funnel");
export const getRevenueIntelligence = () => apiFetch<RevenueIntelligence>("/admin-dashboard/api/revenue-intelligence");

// ============================================================
// Mock Data (used when API is unavailable)
// ============================================================
function getMockData(path: string): unknown {
  if (path.includes("dashboard-stats") || path.includes("plan-prices") && !path.includes("save")) {
    if (path.includes("plan-prices")) {
      return { premium: 29.99, advanced: 69.99, pro: 119.99, elite: 199.99 };
    }
    return {
      total_users: 1247,
      active_subscriptions: 384,
      total_revenue: 28450.00,
      conversion_rate: 30.8,
      new_users_today: 12,
      expiring_soon: 23,
      plan_distribution: [
        { plan: "Free", count: 863, color: "#6B7280" },
        { plan: "Premium", count: 198, color: "#3B82F6" },
        { plan: "Advanced", count: 102, color: "#8B5CF6" },
        { plan: "Pro", count: 56, color: "#F59E0B" },
        { plan: "Elite", count: 28, color: "#10B981" },
      ],
      recent_activity: [
        { action: "Nouvel abonnement Pro", user: "marc@email.com", time: "Il y a 5 min", type: "subscription" },
        { action: "Inscription", user: "julie@gmail.com", time: "Il y a 12 min", type: "signup" },
        { action: "Upgrade Elite", user: "alex@crypto.io", time: "Il y a 25 min", type: "upgrade" },
        { action: "Code promo utilisé: SAVE20", user: "pierre@mail.com", time: "Il y a 1h", type: "promo" },
        { action: "Message contact reçu", user: "sarah@web.com", time: "Il y a 2h", type: "message" },
        { action: "Ebook téléchargé", user: "thomas@dev.fr", time: "Il y a 3h", type: "download" },
      ],
      revenue_chart: [
        { month: "Sep", revenue: 18200 },
        { month: "Oct", revenue: 21500 },
        { month: "Nov", revenue: 19800 },
        { month: "Déc", revenue: 24100 },
        { month: "Jan", revenue: 26300 },
        { month: "Fév", revenue: 28450 },
      ],
    };
  }

  if (path.includes("users")) {
    return {
      users: [
        { username: "admin", role: "admin", plan: "elite", subscription_end: "2027-02-17", created_at: "2024-01-15" },
        { username: "marc@email.com", role: "user", plan: "pro", subscription_end: "2026-08-15", created_at: "2025-06-10" },
        { username: "julie@gmail.com", role: "user", plan: "premium", subscription_end: "2026-04-20", created_at: "2025-11-03" },
        { username: "alex@crypto.io", role: "user", plan: "elite", subscription_end: "2027-01-01", created_at: "2025-03-22" },
        { username: "pierre@mail.com", role: "user", plan: "advanced", subscription_end: "2026-06-30", created_at: "2025-09-14" },
        { username: "sarah@web.com", role: "user", plan: "free", created_at: "2026-01-05" },
        { username: "thomas@dev.fr", role: "user", plan: "premium", subscription_end: "2026-05-18", created_at: "2025-12-20" },
        { username: "emma@trade.ca", role: "user", plan: "pro", subscription_end: "2026-09-10", created_at: "2025-07-08" },
        { username: "lucas@btc.net", role: "user", plan: "free", created_at: "2026-02-01" },
        { username: "chloe@defi.xyz", role: "user", plan: "advanced", subscription_end: "2026-07-25", created_at: "2025-10-30" },
      ],
    };
  }

  if (path.includes("list-promos")) {
    return {
      success: true,
      promos: [
        { code: "LAUNCH50", discount: 50, type: "percent", max_uses: 100, current_uses: 47, active: true, created_at: "2025-12-01", expires_at: "2026-06-01" },
        { code: "EARLYBIRD30", discount: 30, type: "percent", max_uses: 200, current_uses: 132, active: true, created_at: "2025-11-15", expires_at: "2026-03-15" },
        { code: "WELCOME10", discount: 10, type: "percent", max_uses: 500, current_uses: 289, active: true, created_at: "2025-10-01" },
        { code: "VIP2026", discount: 25, type: "percent", max_uses: 50, current_uses: 12, active: true, created_at: "2026-01-01", expires_at: "2026-12-31" },
        { code: "EXPIRED20", discount: 20, type: "percent", max_uses: 100, current_uses: 100, active: false, created_at: "2025-06-01", expires_at: "2025-12-31" },
      ],
    };
  }

  if (path.includes("messages")) {
    return {
      messages: [
        { id: 1, name: "Jean Dupont", email: "jean@email.com", subject: "Question sur le plan Pro", message: "Bonjour, je voudrais savoir si le plan Pro inclut l'accès aux signaux AI en temps réel ?", created_at: "2026-02-17T10:30:00", read: false },
        { id: 2, name: "Marie Martin", email: "marie@gmail.com", subject: "Problème de connexion", message: "Je n'arrive plus à me connecter depuis ce matin. Mon email est marie@gmail.com.", created_at: "2026-02-16T14:22:00", read: true },
        { id: 3, name: "Paul Bernard", email: "paul@crypto.fr", subject: "Demande de partenariat", message: "Nous sommes une plateforme d'échange et aimerions discuter d'un partenariat.", created_at: "2026-02-15T09:15:00", read: false },
        { id: 4, name: "Sophie Leroy", email: "sophie@web.ca", subject: "Remboursement", message: "Je souhaite annuler mon abonnement et obtenir un remboursement.", created_at: "2026-02-14T16:45:00", read: true },
      ],
    };
  }

  if (path.includes("ebooks")) {
    return {
      ebooks: [
        { id: 1, title: "Guide Complet du Trading Crypto", description: "Apprenez les bases du trading de cryptomonnaies", file_path: "/ebooks/guide-trading.pdf", plan_required: "premium", active: true, downloads: 234, created_at: "2025-08-15" },
        { id: 2, title: "Analyse Technique Avancée", description: "Maîtrisez les indicateurs techniques", file_path: "/ebooks/analyse-technique.pdf", plan_required: "advanced", active: true, downloads: 156, created_at: "2025-10-20" },
        { id: 3, title: "DeFi: Le Guide Ultime", description: "Tout sur la finance décentralisée", file_path: "/ebooks/defi-guide.pdf", plan_required: "pro", active: true, downloads: 89, created_at: "2025-12-01" },
        { id: 4, title: "Stratégies de Bull Run", description: "Comment profiter des cycles haussiers", file_path: "/ebooks/bull-run.pdf", plan_required: "elite", active: false, downloads: 45, created_at: "2026-01-10" },
      ],
    };
  }

  if (path.includes("retention")) {
    return {
      success: true,
      red_zone: [
        { username: "user1@mail.com", plan: "premium", days_until_expiry: 2, expiry_date: "2026-02-19" },
        { username: "user2@mail.com", plan: "advanced", days_until_expiry: 5, expiry_date: "2026-02-22" },
      ],
      orange_zone: [
        { username: "user3@mail.com", plan: "pro", days_until_expiry: 12, expiry_date: "2026-03-01" },
        { username: "user4@mail.com", plan: "premium", days_until_expiry: 18, expiry_date: "2026-03-07" },
        { username: "user5@mail.com", plan: "advanced", days_until_expiry: 21, expiry_date: "2026-03-10" },
      ],
      yellow_zone: [
        { username: "user6@mail.com", plan: "elite", days_until_expiry: 35, expiry_date: "2026-03-24" },
        { username: "user7@mail.com", plan: "pro", days_until_expiry: 42, expiry_date: "2026-03-31" },
      ],
    };
  }

  if (path.includes("conversion-funnel")) {
    return {
      success: true,
      steps: [
        { name: "Visiteurs", count: 15420, rate: 100 },
        { name: "Inscrits", count: 1247, rate: 8.1 },
        { name: "Essai gratuit", count: 863, rate: 69.2 },
        { name: "Abonnés payants", count: 384, rate: 44.5 },
        { name: "Renouvellements", count: 267, rate: 69.5 },
      ],
    };
  }

  if (path.includes("revenue-intelligence")) {
    return {
      success: true,
      stats: { total_referrals: 342, paid_referrals: 89, revenue_generated: "$12,450 CAD" },
      leaderboard: [
        { username: "influencer1@yt.com", referrals: 45, paid: 12, revenue: 2400 },
        { username: "blogger@crypto.fr", referrals: 32, paid: 9, revenue: 1800 },
        { username: "trader@pro.ca", referrals: 28, paid: 8, revenue: 1600 },
        { username: "coach@btc.net", referrals: 21, paid: 6, revenue: 1200 },
      ],
      sources: [
        { name: "Google", count: 4520 },
        { name: "Twitter/X", count: 3200 },
        { name: "YouTube", count: 2800 },
        { name: "Referral", count: 1900 },
        { name: "Direct", count: 3000 },
      ],
    };
  }

  if (path.includes("plan-access") || path.includes("get-plan-access")) {
    return { allowed: ["dashboard", "ai-market-regime", "ai-signals", "fear-greed", "heatmap"] };
  }

  return { success: true, message: "OK" };
}

// ============================================================
// Web SDK Client (used by AuthCallback)
// ============================================================
import { createClient } from '@metagptx/web-sdk';
export const client = createClient();