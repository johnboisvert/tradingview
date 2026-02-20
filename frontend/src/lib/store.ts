// CryptoIA localStorage persistence service
// Uses localStorage as backend with mock data as initial defaults

import type { User, PromoCode, ContactMessage, Ebook, PlanPrices } from "./api";

// ============================================================
// Keys
// ============================================================
const KEYS = {
  USERS: "cryptoia_users",
  PROMOS: "cryptoia_promos",
  MESSAGES: "cryptoia_messages",
  EBOOKS: "cryptoia_ebooks",
  PLAN_PRICES: "cryptoia_plan_prices",
  PLAN_ACCESS: "cryptoia_plan_access",
} as const;

// ============================================================
// Helpers
// ============================================================
function getItem<T>(key: string, defaultValue: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (raw) return JSON.parse(raw);
  } catch {
    // ignore
  }
  return defaultValue;
}

function setItem<T>(key: string, value: T): void {
  localStorage.setItem(key, JSON.stringify(value));
}

// ============================================================
// Default Data
// NOTE: Only admin user kept for production. Mock users removed.
// ============================================================
const DEFAULT_USERS: User[] = [
  { username: "admin", role: "admin", plan: "elite", subscription_end: "2027-02-17", created_at: "2024-01-15" },
];

const DEFAULT_PROMOS: PromoCode[] = [
  { code: "LAUNCH50", discount: 50, type: "percent", max_uses: 100, current_uses: 0, active: true, created_at: "2026-02-19", expires_at: "2026-08-01" },
  { code: "WELCOME10", discount: 10, type: "percent", max_uses: 500, current_uses: 0, active: true, created_at: "2026-02-19" },
];

const DEFAULT_MESSAGES: ContactMessage[] = [];

const DEFAULT_EBOOKS: Ebook[] = [
  { id: 1, title: "Guide Complet du Trading Crypto", description: "Apprenez les bases du trading de cryptomonnaies. Ce guide couvre tout, des exchanges aux premières stratégies.", file_path: "/ebooks/guide-trading.pdf", plan_required: "premium", active: true, downloads: 0, created_at: "2026-02-19", category: "Guides", format: "PDF", size: "2.4 MB" },
  { id: 2, title: "Analyse Technique Avancée", description: "Maîtrisez les indicateurs techniques : RSI, MACD, Bollinger, patterns chartistes.", file_path: "/ebooks/analyse-technique.pdf", plan_required: "advanced", active: true, downloads: 0, created_at: "2026-02-19", category: "Guides", format: "PDF", size: "3.1 MB" },
  { id: 3, title: "DeFi: Le Guide Ultime", description: "Tout sur la finance décentralisée : protocoles, TVL, rendements, farming.", file_path: "/ebooks/defi-guide.pdf", plan_required: "pro", active: true, downloads: 0, created_at: "2026-02-19", category: "Guides", format: "PDF", size: "1.8 MB" },
  { id: 4, title: "Stratégies de Bull Run", description: "Comment profiter des cycles haussiers et maximiser vos gains.", file_path: "/ebooks/bull-run.pdf", plan_required: "elite", active: true, downloads: 0, created_at: "2026-02-19", category: "Guides", format: "PDF", size: "2.1 MB" },
  { id: 5, title: "Cheat Sheet Analyse Technique", description: "Résumé visuel de tous les indicateurs techniques essentiels.", file_path: "/ebooks/cheatsheet-at.pdf", plan_required: "free", active: true, downloads: 0, created_at: "2026-02-19", category: "Cheat Sheets", format: "PDF", size: "1.8 MB" },
  { id: 6, title: "Template Journal de Trading", description: "Spreadsheet pour suivre vos trades et analyser vos performances.", file_path: "/ebooks/journal-trading.xlsx", plan_required: "premium", active: true, downloads: 0, created_at: "2026-02-19", category: "Templates", format: "XLSX", size: "450 KB" },
  { id: 7, title: "Checklist Risk Management", description: "Liste de vérification avant chaque trade : position sizing, stop loss, risk/reward.", file_path: "/ebooks/checklist-rm.pdf", plan_required: "free", active: true, downloads: 0, created_at: "2026-02-19", category: "Cheat Sheets", format: "PDF", size: "320 KB" },
  { id: 8, title: "Glossaire Crypto A-Z", description: "Dictionnaire complet des termes crypto et trading.", file_path: "/ebooks/glossaire.pdf", plan_required: "free", active: true, downloads: 0, created_at: "2026-02-19", category: "Guides", format: "PDF", size: "1.2 MB" },
];

const DEFAULT_PLAN_PRICES: PlanPrices = {
  premium: 29.99,
  advanced: 69.99,
  pro: 119.99,
  elite: 199.99,
};

const DEFAULT_PLAN_ACCESS: Record<string, string[]> = {
  // Gratuit : accès basique — Score Confiance IA en lecture seule (via ai-signals limité), 3 alertes max
  free: [
    "dashboard", "fear-greed", "heatmap", "convertisseur", "calculatrice",
  ],
  // Premium : MyCryptoIA, AlertesIA (illimitées), ScoreConfianceIA, RapportHebdomadaireIA, AssistantIA
  premium: [
    "dashboard", "fear-greed", "heatmap", "altcoin-season", "dominance",
    "convertisseur", "calculatrice", "calendrier", "nouvelles", "academy", "downloads",
    "strategie", "technical-analyzer", "crypto-journal",
    "ai-signals", "ai-coach",
  ],
  // Advanced : + SimulateurStrategieIA, BacktestingVisuel
  advanced: [
    "dashboard", "fear-greed", "heatmap", "altcoin-season", "dominance",
    "convertisseur", "calculatrice", "calendrier", "nouvelles", "academy", "downloads",
    "ai-market-regime", "ai-signals", "strategie", "technical-analyzer", "bullrun",
    "portfolio", "market-simulation", "crypto-journal", "screener-technique",
    "ai-coach", "setup-builder", "backtesting-visuel",
  ],
  // Pro : + Gamification (badges exclusifs), PWA installable
  pro: [
    "dashboard", "fear-greed", "heatmap", "altcoin-season", "dominance",
    "convertisseur", "calculatrice", "calendrier", "nouvelles", "academy", "downloads",
    "ai-market-regime", "ai-signals", "strategie", "technical-analyzer", "bullrun",
    "ai-whale-tracker", "ai-news-analyzer", "crypto-pepites", "defi-yield", "onchain",
    "portfolio", "market-simulation", "support", "token-scanner",
    "crypto-journal", "screener-technique",
    "ai-coach", "setup-builder", "backtesting-visuel", "gamification",
  ],
  // Elite : accès complet à tout
  elite: [
    "dashboard", "fear-greed", "heatmap", "altcoin-season", "dominance",
    "convertisseur", "calculatrice", "calendrier", "nouvelles", "academy", "downloads",
    "ai-market-regime", "ai-signals", "strategie", "technical-analyzer", "bullrun",
    "ai-whale-tracker", "ai-news-analyzer", "crypto-pepites", "defi-yield", "onchain",
    "portfolio", "market-simulation", "support", "token-scanner",
    "crypto-journal", "screener-technique",
    "ai-coach", "ai-swarm", "narrative-radar", "scam-shield", "altseason-copilot",
    "setup-builder", "backtesting-visuel", "gamification",
  ],
};

// ============================================================
// Store API
// ============================================================

// --- Users ---
export function getUsers(): User[] {
  return getItem(KEYS.USERS, DEFAULT_USERS);
}
export function saveUsers(users: User[]): void {
  setItem(KEYS.USERS, users);
}
export function addUser(user: User): void {
  const users = getUsers();
  users.push(user);
  saveUsers(users);
}

export function loginUser(username: string, password: string): User | null {
  const users = getUsers();
  const user = users.find(
    (u) => u.username.toLowerCase() === username.toLowerCase() && u.password === password
  );
  return user || null;
}

export function getUserSession(): { username: string; plan: string } | null {
  try {
    const raw = sessionStorage.getItem("cryptoia_user_session");
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return null;
}

export function setUserSession(username: string, plan: string): void {
  sessionStorage.setItem("cryptoia_user_session", JSON.stringify({ username, plan }));
}

export function clearUserSession(): void {
  sessionStorage.removeItem("cryptoia_user_session");
}
export function deleteUser(username: string): boolean {
  const users = getUsers();
  const filtered = users.filter((u) => u.username !== username);
  if (filtered.length === users.length) return false;
  saveUsers(filtered);
  return true;
}
export function updateUserPlan(username: string, plan: string): boolean {
  const users = getUsers();
  const user = users.find((u) => u.username === username);
  if (!user) return false;
  user.plan = plan;
  // Set subscription end to 1 year from now for paid plans
  if (plan !== "free") {
    const end = new Date();
    end.setFullYear(end.getFullYear() + 1);
    user.subscription_end = end.toISOString().split("T")[0];
  } else {
    user.subscription_end = undefined;
  }
  saveUsers(users);
  return true;
}

// --- Promos ---
export function getPromos(): PromoCode[] {
  return getItem(KEYS.PROMOS, DEFAULT_PROMOS);
}
export function savePromos(promos: PromoCode[]): void {
  setItem(KEYS.PROMOS, promos);
}
export function addPromo(promo: PromoCode): void {
  const promos = getPromos();
  promos.push(promo);
  savePromos(promos);
}
export function deletePromo(code: string): boolean {
  const promos = getPromos();
  const filtered = promos.filter((p) => p.code !== code);
  if (filtered.length === promos.length) return false;
  savePromos(filtered);
  return true;
}
export function togglePromo(code: string): boolean {
  const promos = getPromos();
  const promo = promos.find((p) => p.code === code);
  if (!promo) return false;
  promo.active = !promo.active;
  savePromos(promos);
  return true;
}
export function validatePromo(code: string): { valid: boolean; discount: number; type: string; message: string } {
  const promos = getPromos();
  const promo = promos.find((p) => p.code.toUpperCase() === code.toUpperCase());
  if (!promo) return { valid: false, discount: 0, type: "percent", message: "Code promo invalide" };
  if (!promo.active) return { valid: false, discount: 0, type: "percent", message: "Ce code promo est inactif" };
  if (promo.expires_at && new Date(promo.expires_at) < new Date()) return { valid: false, discount: 0, type: "percent", message: "Ce code promo a expiré" };
  if (promo.current_uses >= promo.max_uses) return { valid: false, discount: 0, type: "percent", message: "Ce code promo a atteint sa limite d'utilisation" };
  return { valid: true, discount: promo.discount, type: promo.type, message: `Code valide — ${promo.discount}% de réduction appliquée !` };
}
export function usePromoCode(code: string): boolean {
  const promos = getPromos();
  const promo = promos.find((p) => p.code.toUpperCase() === code.toUpperCase());
  if (!promo) return false;
  promo.current_uses += 1;
  savePromos(promos);
  return true;
}

// --- Messages ---
export function getMessages(): ContactMessage[] {
  return getItem(KEYS.MESSAGES, DEFAULT_MESSAGES);
}
export function saveMessages(messages: ContactMessage[]): void {
  setItem(KEYS.MESSAGES, messages);
}
export function addMessage(msg: Omit<ContactMessage, "id" | "created_at" | "read">): ContactMessage {
  const messages = getMessages();
  const newMsg: ContactMessage = {
    ...msg,
    id: messages.length > 0 ? Math.max(...messages.map((m) => m.id)) + 1 : 1,
    created_at: new Date().toISOString(),
    read: false,
  };
  messages.unshift(newMsg);
  saveMessages(messages);
  return newMsg;
}
export function markMessageRead(id: number): void {
  const messages = getMessages();
  const msg = messages.find((m) => m.id === id);
  if (msg) {
    msg.read = true;
    saveMessages(messages);
  }
}
export function deleteMessage(id: number): boolean {
  const messages = getMessages();
  const filtered = messages.filter((m) => m.id !== id);
  if (filtered.length === messages.length) return false;
  saveMessages(filtered);
  return true;
}

// --- Ebooks ---
export function getEbooks(): Ebook[] {
  return getItem(KEYS.EBOOKS, DEFAULT_EBOOKS);
}
export function saveEbooks(ebooks: Ebook[]): void {
  setItem(KEYS.EBOOKS, ebooks);
}
export function addEbook(ebook: Omit<Ebook, "id" | "created_at" | "downloads">): Ebook {
  const ebooks = getEbooks();
  const newEbook: Ebook = {
    ...ebook,
    id: ebooks.length > 0 ? Math.max(...ebooks.map((e) => e.id)) + 1 : 1,
    created_at: new Date().toISOString().split("T")[0],
    downloads: 0,
  };
  ebooks.push(newEbook);
  saveEbooks(ebooks);
  return newEbook;
}
export function updateEbook(id: number, data: Partial<Ebook>): boolean {
  const ebooks = getEbooks();
  const idx = ebooks.findIndex((e) => e.id === id);
  if (idx === -1) return false;
  ebooks[idx] = { ...ebooks[idx], ...data };
  saveEbooks(ebooks);
  return true;
}
export function deleteEbook(id: number): boolean {
  const ebooks = getEbooks();
  const filtered = ebooks.filter((e) => e.id !== id);
  if (filtered.length === ebooks.length) return false;
  saveEbooks(filtered);
  return true;
}
export function incrementEbookDownloads(id: number): void {
  const ebooks = getEbooks();
  const ebook = ebooks.find((e) => e.id === id);
  if (ebook) {
    ebook.downloads += 1;
    saveEbooks(ebooks);
  }
}

// --- Plan Prices ---
export function getPlanPrices(): PlanPrices {
  return getItem(KEYS.PLAN_PRICES, DEFAULT_PLAN_PRICES);
}
export function savePlanPrices(prices: PlanPrices): void {
  setItem(KEYS.PLAN_PRICES, prices);
}

// --- Plan Access ---
export function getPlanAccess(plan: string): string[] {
  const all = getItem(KEYS.PLAN_ACCESS, DEFAULT_PLAN_ACCESS);
  return all[plan] || [];
}
export function savePlanAccess(plan: string, routes: string[]): void {
  const all = getItem(KEYS.PLAN_ACCESS, DEFAULT_PLAN_ACCESS);
  all[plan] = routes;
  setItem(KEYS.PLAN_ACCESS, all);
}

// --- Dashboard Stats (computed from real data) ---
export function getDashboardStats() {
  const users = getUsers();
  const messages = getMessages();
  const ebooks = getEbooks();
  const promos = getPromos();
  const prices = getPlanPrices();

  const totalUsers = users.length;
  const paidUsers = users.filter((u) => u.plan !== "free");
  const activeSubscriptions = paidUsers.length;

  // Estimate revenue from paid users
  const planPriceMap: Record<string, number> = {
    premium: prices.premium,
    advanced: prices.advanced,
    pro: prices.pro,
    elite: prices.elite,
  };
  const totalRevenue = paidUsers.reduce((sum, u) => sum + (planPriceMap[u.plan] || 0), 0);

  const conversionRate = totalUsers > 0 ? Math.round((activeSubscriptions / totalUsers) * 1000) / 10 : 0;
  const unreadMessages = messages.filter((m) => !m.read).length;
  const activeEbooks = ebooks.filter((e) => e.active).length;
  const totalDownloads = ebooks.reduce((sum, e) => sum + e.downloads, 0);
  const activePromos = promos.filter((p) => p.active).length;

  const planDistribution = [
    { plan: "Free", count: users.filter((u) => u.plan === "free").length, color: "#6B7280" },
    { plan: "Premium", count: users.filter((u) => u.plan === "premium").length, color: "#3B82F6" },
    { plan: "Advanced", count: users.filter((u) => u.plan === "advanced").length, color: "#8B5CF6" },
    { plan: "Pro", count: users.filter((u) => u.plan === "pro").length, color: "#F59E0B" },
    { plan: "Elite", count: users.filter((u) => u.plan === "elite").length, color: "#10B981" },
  ];

  return {
    totalUsers,
    activeSubscriptions,
    totalRevenue,
    conversionRate,
    unreadMessages,
    activeEbooks,
    totalDownloads,
    activePromos,
    planDistribution,
    messages,
    ebooks,
    promos,
    users,
  };
}