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
// ============================================================
const DEFAULT_USERS: User[] = [
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
];

const DEFAULT_PROMOS: PromoCode[] = [
  { code: "LAUNCH50", discount: 50, type: "percent", max_uses: 100, current_uses: 47, active: true, created_at: "2025-12-01", expires_at: "2026-06-01" },
  { code: "EARLYBIRD30", discount: 30, type: "percent", max_uses: 200, current_uses: 132, active: true, created_at: "2025-11-15", expires_at: "2026-03-15" },
  { code: "WELCOME10", discount: 10, type: "percent", max_uses: 500, current_uses: 289, active: true, created_at: "2025-10-01" },
  { code: "VIP2026", discount: 25, type: "percent", max_uses: 50, current_uses: 12, active: true, created_at: "2026-01-01", expires_at: "2026-12-31" },
  { code: "EXPIRED20", discount: 20, type: "percent", max_uses: 100, current_uses: 100, active: false, created_at: "2025-06-01", expires_at: "2025-12-31" },
];

const DEFAULT_MESSAGES: ContactMessage[] = [
  { id: 1, name: "Jean Dupont", email: "jean@email.com", subject: "Question sur le plan Pro", message: "Bonjour, je voudrais savoir si le plan Pro inclut l'accès aux signaux AI en temps réel ?", created_at: "2026-02-17T10:30:00", read: false },
  { id: 2, name: "Marie Martin", email: "marie@gmail.com", subject: "Problème de connexion", message: "Je n'arrive plus à me connecter depuis ce matin. Mon email est marie@gmail.com.", created_at: "2026-02-16T14:22:00", read: true },
  { id: 3, name: "Paul Bernard", email: "paul@crypto.fr", subject: "Demande de partenariat", message: "Nous sommes une plateforme d'échange et aimerions discuter d'un partenariat.", created_at: "2026-02-15T09:15:00", read: false },
  { id: 4, name: "Sophie Leroy", email: "sophie@web.ca", subject: "Remboursement", message: "Je souhaite annuler mon abonnement et obtenir un remboursement.", created_at: "2026-02-14T16:45:00", read: true },
];

const DEFAULT_EBOOKS: Ebook[] = [
  { id: 1, title: "Guide Complet du Trading Crypto", description: "Apprenez les bases du trading de cryptomonnaies. Ce guide couvre tout, des exchanges aux premières stratégies.", file_path: "/ebooks/guide-trading.pdf", plan_required: "premium", active: true, downloads: 234, created_at: "2025-08-15", category: "Guides", format: "PDF", size: "2.4 MB" },
  { id: 2, title: "Analyse Technique Avancée", description: "Maîtrisez les indicateurs techniques : RSI, MACD, Bollinger, patterns chartistes.", file_path: "/ebooks/analyse-technique.pdf", plan_required: "advanced", active: true, downloads: 156, created_at: "2025-10-20", category: "Guides", format: "PDF", size: "3.1 MB" },
  { id: 3, title: "DeFi: Le Guide Ultime", description: "Tout sur la finance décentralisée : protocoles, TVL, rendements, farming.", file_path: "/ebooks/defi-guide.pdf", plan_required: "pro", active: true, downloads: 89, created_at: "2025-12-01", category: "Guides", format: "PDF", size: "1.8 MB" },
  { id: 4, title: "Stratégies de Bull Run", description: "Comment profiter des cycles haussiers et maximiser vos gains.", file_path: "/ebooks/bull-run.pdf", plan_required: "elite", active: false, downloads: 45, created_at: "2026-01-10", category: "Guides", format: "PDF", size: "2.1 MB" },
  { id: 5, title: "Cheat Sheet Analyse Technique", description: "Résumé visuel de tous les indicateurs techniques essentiels.", file_path: "/ebooks/cheatsheet-at.pdf", plan_required: "free", active: true, downloads: 412, created_at: "2025-07-01", category: "Cheat Sheets", format: "PDF", size: "1.8 MB" },
  { id: 6, title: "Template Journal de Trading", description: "Spreadsheet pour suivre vos trades et analyser vos performances.", file_path: "/ebooks/journal-trading.xlsx", plan_required: "premium", active: true, downloads: 198, created_at: "2025-09-15", category: "Templates", format: "XLSX", size: "450 KB" },
  { id: 7, title: "Checklist Risk Management", description: "Liste de vérification avant chaque trade : position sizing, stop loss, risk/reward.", file_path: "/ebooks/checklist-rm.pdf", plan_required: "free", active: true, downloads: 325, created_at: "2025-08-20", category: "Cheat Sheets", format: "PDF", size: "320 KB" },
  { id: 8, title: "Glossaire Crypto A-Z", description: "Dictionnaire complet des termes crypto et trading.", file_path: "/ebooks/glossaire.pdf", plan_required: "free", active: true, downloads: 567, created_at: "2025-06-01", category: "Guides", format: "PDF", size: "1.2 MB" },
];

const DEFAULT_PLAN_PRICES: PlanPrices = {
  premium: 29.99,
  advanced: 69.99,
  pro: 119.99,
  elite: 199.99,
};

const DEFAULT_PLAN_ACCESS: Record<string, string[]> = {
  free: ["dashboard", "fear-greed", "heatmap", "convertisseur", "calculatrice"],
  premium: ["dashboard", "fear-greed", "heatmap", "altcoin-season", "dominance", "convertisseur", "calculatrice", "calendrier", "nouvelles", "academy", "downloads"],
  advanced: ["dashboard", "fear-greed", "heatmap", "altcoin-season", "dominance", "convertisseur", "calculatrice", "calendrier", "nouvelles", "academy", "downloads", "ai-market-regime", "ai-signals", "strategie", "technical-analyzer", "bullrun"],
  pro: ["dashboard", "fear-greed", "heatmap", "altcoin-season", "dominance", "convertisseur", "calculatrice", "calendrier", "nouvelles", "academy", "downloads", "ai-market-regime", "ai-signals", "strategie", "technical-analyzer", "bullrun", "ai-whale-tracker", "ai-news-analyzer", "crypto-pepites", "defi-yield", "onchain", "portfolio", "market-simulation", "support"],
  elite: ["dashboard", "fear-greed", "heatmap", "altcoin-season", "dominance", "convertisseur", "calculatrice", "calendrier", "nouvelles", "academy", "downloads", "ai-market-regime", "ai-signals", "strategie", "technical-analyzer", "bullrun", "ai-whale-tracker", "ai-news-analyzer", "crypto-pepites", "defi-yield", "onchain", "portfolio", "market-simulation", "support", "ai-coach", "ai-swarm", "narrative-radar", "scam-shield", "altseason-copilot", "setup-builder", "token-scanner"],
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