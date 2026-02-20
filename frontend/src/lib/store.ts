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
  PLAN_PRICES_ANNUAL: "cryptoia_plan_prices_annual",
  ANNUAL_DISCOUNT: "cryptoia_annual_discount",
  PLAN_ACCESS: "cryptoia_plan_access",
  ADMINS: "cryptoia_admins",
  ADMIN_LOG: "cryptoia_admin_log",
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

// --- Annual Plan Prices ---
export function getAnnualPlanPrices(): PlanPrices {
  const monthlyPrices = getPlanPrices();
  const discount = getAnnualDiscount();
  const defaultAnnual: PlanPrices = {
    premium: parseFloat((monthlyPrices.premium * (1 - discount / 100)).toFixed(2)),
    advanced: parseFloat((monthlyPrices.advanced * (1 - discount / 100)).toFixed(2)),
    pro: parseFloat((monthlyPrices.pro * (1 - discount / 100)).toFixed(2)),
    elite: parseFloat((monthlyPrices.elite * (1 - discount / 100)).toFixed(2)),
  };
  return getItem(KEYS.PLAN_PRICES_ANNUAL, defaultAnnual);
}
export function saveAnnualPlanPrices(prices: PlanPrices): void {
  setItem(KEYS.PLAN_PRICES_ANNUAL, prices);
}

// --- Annual Discount ---
export function getAnnualDiscount(): number {
  return getItem(KEYS.ANNUAL_DISCOUNT, 20);
}
export function saveAnnualDiscount(discount: number): void {
  setItem(KEYS.ANNUAL_DISCOUNT, discount);
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

// ============================================================
// Admins
// ============================================================
const SUPER_ADMIN_KEY = "cryptoia_super_admin";

export interface Admin {
  email: string;
  passwordHash: string;
  name: string;
  role: "super-admin" | "admin";
  created_at: string;
}

export interface AdminLogEntry {
  email: string;
  action: string;
  timestamp: string;
}

// Simple SHA-256 hash using Web Crypto API
const hashCache = new Map<string, string>();

export async function hashPassword(password: string): Promise<string> {
  if (hashCache.has(password)) return hashCache.get(password)!;
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  hashCache.set(password, hashHex);
  return hashHex;
}

// --- Super Admin (localStorage-based, no env vars dependency) ---

interface StoredSuperAdmin {
  email: string;
  passwordHash: string;
  name: string;
  created_at: string;
}

function getEnvSuperAdminEmail(): string {
  const val = (typeof import.meta !== "undefined" && import.meta.env?.VITE_ADMIN_EMAIL) || "";
  return val.trim();
}

function getEnvSuperAdminPassword(): string {
  const val = (typeof import.meta !== "undefined" && import.meta.env?.VITE_ADMIN_PASSWORD) || "";
  return val.trim();
}

function getStoredSuperAdmin(): StoredSuperAdmin | null {
  try {
    const raw = localStorage.getItem(SUPER_ADMIN_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return null;
}

function saveStoredSuperAdmin(admin: StoredSuperAdmin): void {
  localStorage.setItem(SUPER_ADMIN_KEY, JSON.stringify(admin));
}

/** Check if a super-admin is configured (either env vars or localStorage) */
export function isSuperAdminConfigured(): boolean {
  const envEmail = getEnvSuperAdminEmail();
  const envPassword = getEnvSuperAdminPassword();
  if (envEmail && envPassword) return true;
  return getStoredSuperAdmin() !== null;
}

/** Get the super-admin email (env vars take priority, then localStorage) */
export function getSuperAdminEmail(): string {
  const envEmail = getEnvSuperAdminEmail();
  if (envEmail) return envEmail;
  const stored = getStoredSuperAdmin();
  return stored?.email || "";
}

/** Create the initial super-admin (stored in localStorage with hashed password) */
export async function initSuperAdmin(
  email: string,
  name: string,
  password: string
): Promise<{ success: boolean; message: string }> {
  // Don't allow if already configured
  if (isSuperAdminConfigured()) {
    return { success: false, message: "Un super-admin est déjà configuré." };
  }

  const passwordHash = await hashPassword(password);
  saveStoredSuperAdmin({
    email,
    passwordHash,
    name: name || "Super Admin",
    created_at: new Date().toISOString(),
  });

  addAdminLog(email, "Création du compte super-admin (setup initial)");
  return { success: true, message: "Super-admin créé avec succès." };
}

/** Update the super-admin password (localStorage-based super-admin only) */
export async function updateSuperAdminPassword(newPassword: string): Promise<{ success: boolean; message: string }> {
  const stored = getStoredSuperAdmin();
  if (!stored) {
    return { success: false, message: "Aucun super-admin localStorage trouvé. Le super-admin env ne peut pas être modifié ici." };
  }
  stored.passwordHash = await hashPassword(newPassword);
  saveStoredSuperAdmin(stored);
  addAdminLog(stored.email, "Mot de passe super-admin réinitialisé");
  return { success: true, message: "Mot de passe super-admin mis à jour." };
}

/** Update the super-admin email (localStorage-based super-admin only) */
export async function updateSuperAdminEmail(newEmail: string): Promise<{ success: boolean; message: string }> {
  const stored = getStoredSuperAdmin();
  if (!stored) {
    return { success: false, message: "Aucun super-admin localStorage trouvé." };
  }
  const oldEmail = stored.email;
  stored.email = newEmail;
  saveStoredSuperAdmin(stored);
  addAdminLog(newEmail, `Email super-admin changé de ${oldEmail} à ${newEmail}`);
  return { success: true, message: "Email super-admin mis à jour." };
}

// --- Secondary Admins ---

export function getAdmins(): Admin[] {
  return getItem<Admin[]>(KEYS.ADMINS, []);
}

export function saveAdmins(admins: Admin[]): void {
  setItem(KEYS.ADMINS, admins);
}

export async function addAdmin(email: string, name: string, password: string): Promise<{ success: boolean; message: string }> {
  const admins = getAdmins();
  const superEmail = getSuperAdminEmail();

  if (superEmail && email.toLowerCase() === superEmail.toLowerCase()) {
    return { success: false, message: "Cet email est réservé au super-admin." };
  }
  if (admins.find((a) => a.email.toLowerCase() === email.toLowerCase())) {
    return { success: false, message: "Un admin avec cet email existe déjà." };
  }

  const passwordHash = await hashPassword(password);
  admins.push({
    email,
    passwordHash,
    name,
    role: "admin",
    created_at: new Date().toISOString(),
  });
  saveAdmins(admins);
  addAdminLog(superEmail || "system", `Ajout admin: ${email}`);
  return { success: true, message: "Admin ajouté avec succès." };
}

export function deleteAdmin(email: string): { success: boolean; message: string } {
  const admins = getAdmins();
  const superEmail = getSuperAdminEmail();

  if (superEmail && email.toLowerCase() === superEmail.toLowerCase()) {
    return { success: false, message: "Impossible de supprimer le super-admin." };
  }

  const filtered = admins.filter((a) => a.email.toLowerCase() !== email.toLowerCase());
  if (filtered.length === admins.length) {
    return { success: false, message: "Admin introuvable." };
  }

  saveAdmins(filtered);
  addAdminLog(superEmail || "system", `Suppression admin: ${email}`);
  return { success: true, message: "Admin supprimé." };
}

export async function updateAdminPassword(email: string, newPassword: string): Promise<{ success: boolean; message: string }> {
  // Check if it's the localStorage super-admin
  const stored = getStoredSuperAdmin();
  if (stored && email.toLowerCase() === stored.email.toLowerCase()) {
    return updateSuperAdminPassword(newPassword);
  }

  const admins = getAdmins();
  const admin = admins.find((a) => a.email.toLowerCase() === email.toLowerCase());
  if (!admin) return { success: false, message: "Admin introuvable." };

  admin.passwordHash = await hashPassword(newPassword);
  saveAdmins(admins);
  addAdminLog(email, "Mot de passe réinitialisé");
  return { success: true, message: "Mot de passe mis à jour." };
}

export async function loginAdmin(email: string, password: string): Promise<{ success: boolean; role: "super-admin" | "admin" | null; name: string }> {
  const trimmedEmail = email.trim().toLowerCase();
  const trimmedPassword = password.trim();

  // 1. Check env vars super-admin first
  const envEmail = getEnvSuperAdminEmail();
  const envPassword = getEnvSuperAdminPassword();
  if (envEmail && envPassword && trimmedEmail === envEmail.trim().toLowerCase() && trimmedPassword === envPassword.trim()) {
    setAdminSession(envEmail, "super-admin", "Super Admin");
    addAdminLog(envEmail, "Connexion (super-admin env)");
    return { success: true, role: "super-admin", name: "Super Admin" };
  }

  // 2. Check localStorage super-admin
  const storedSuperAdmin = getStoredSuperAdmin();
  if (storedSuperAdmin && trimmedEmail === storedSuperAdmin.email.trim().toLowerCase()) {
    const passwordHash = await hashPassword(trimmedPassword);
    if (passwordHash === storedSuperAdmin.passwordHash) {
      setAdminSession(storedSuperAdmin.email, "super-admin", storedSuperAdmin.name);
      addAdminLog(storedSuperAdmin.email, "Connexion (super-admin)");
      return { success: true, role: "super-admin", name: storedSuperAdmin.name };
    }
  }

  // 3. Check secondary admins
  const admins = getAdmins();
  const admin = admins.find((a) => a.email.trim().toLowerCase() === trimmedEmail);
  if (admin) {
    const passwordHash = await hashPassword(trimmedPassword);
    if (passwordHash === admin.passwordHash) {
      setAdminSession(admin.email, admin.role, admin.name);
      addAdminLog(admin.email, `Connexion (${admin.role})`);
      return { success: true, role: admin.role, name: admin.name };
    }
  }

  return { success: false, role: null, name: "" };
}

// --- Admin Session ---
export interface AdminSession {
  email: string;
  role: "super-admin" | "admin";
  name: string;
}

export function getAdminSession(): AdminSession | null {
  try {
    const raw = sessionStorage.getItem("cryptoia_admin_session");
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return null;
}

export function setAdminSession(email: string, role: "super-admin" | "admin", name: string): void {
  sessionStorage.setItem("cryptoia_admin_auth", "true");
  sessionStorage.setItem("cryptoia_admin_session", JSON.stringify({ email, role, name }));
}

export function clearAdminSession(): void {
  sessionStorage.removeItem("cryptoia_admin_auth");
  sessionStorage.removeItem("cryptoia_admin_session");
}

export function isAdminSessionActive(): boolean {
  return sessionStorage.getItem("cryptoia_admin_auth") === "true";
}

// --- Admin Activity Log ---
export function getAdminLog(): AdminLogEntry[] {
  return getItem<AdminLogEntry[]>(KEYS.ADMIN_LOG, []);
}

export function addAdminLog(email: string, action: string): void {
  const log = getAdminLog();
  log.unshift({ email, action, timestamp: new Date().toISOString() });
  // Keep last 100 entries
  if (log.length > 100) log.length = 100;
  setItem(KEYS.ADMIN_LOG, log);
}

// ============================================================
// Session Protection (Anti-sharing / Double Connection)
// ============================================================
const SESSION_TOKENS_KEY = "cryptoia_session_tokens";

interface SessionToken {
  username: string;
  token: string;
  fingerprint: string;
  created_at: string;
  last_active: string;
}

/** Generate a unique browser fingerprint */
function generateFingerprint(): string {
  const nav = window.navigator;
  const screen = window.screen;
  const raw = [
    nav.userAgent,
    nav.language,
    screen.width,
    screen.height,
    screen.colorDepth,
    new Date().getTimezoneOffset(),
    nav.hardwareConcurrency || "unknown",
  ].join("|");
  // Simple hash
  let hash = 0;
  for (let i = 0; i < raw.length; i++) {
    const char = raw.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return "fp_" + Math.abs(hash).toString(36);
}

/** Generate a random session token */
function generateSessionToken(): string {
  const arr = new Uint8Array(16);
  crypto.getRandomValues(arr);
  return Array.from(arr, (b) => b.toString(16).padStart(2, "0")).join("");
}

/** Get all active session tokens */
function getSessionTokens(): SessionToken[] {
  return getItem<SessionToken[]>(SESSION_TOKENS_KEY, []);
}

/** Save session tokens */
function saveSessionTokens(tokens: SessionToken[]): void {
  setItem(SESSION_TOKENS_KEY, tokens);
}

/**
 * Register a new session for a user. Invalidates any previous session.
 * Returns the new session token.
 */
export function registerUserSession(username: string): string {
  const tokens = getSessionTokens();
  // Remove any existing session for this user
  const filtered = tokens.filter((t) => t.username.toLowerCase() !== username.toLowerCase());
  const now = new Date().toISOString();
  const newToken: SessionToken = {
    username: username.toLowerCase(),
    token: generateSessionToken(),
    fingerprint: generateFingerprint(),
    created_at: now,
    last_active: now,
  };
  filtered.push(newToken);
  saveSessionTokens(filtered);
  // Store the token in sessionStorage for this browser tab
  sessionStorage.setItem("cryptoia_session_token", newToken.token);
  return newToken.token;
}

/**
 * Validate the current session. Returns true if the session is still valid
 * (i.e., no one else has logged in with the same account).
 */
export function validateUserSession(username: string): { valid: boolean; message: string } {
  const currentToken = sessionStorage.getItem("cryptoia_session_token");
  if (!currentToken) {
    return { valid: false, message: "Session expirée. Veuillez vous reconnecter." };
  }

  const tokens = getSessionTokens();
  const userSession = tokens.find((t) => t.username.toLowerCase() === username.toLowerCase());

  if (!userSession) {
    return { valid: false, message: "Session introuvable. Veuillez vous reconnecter." };
  }

  if (userSession.token !== currentToken) {
    // Someone else logged in with this account — force disconnect
    sessionStorage.removeItem("cryptoia_user_session");
    sessionStorage.removeItem("cryptoia_session_token");
    localStorage.removeItem("cryptoia_user_plan");
    return {
      valid: false,
      message: "Votre compte est connecté sur un autre appareil. Vous avez été déconnecté pour des raisons de sécurité.",
    };
  }

  // Update last_active
  userSession.last_active = new Date().toISOString();
  saveSessionTokens(tokens);
  return { valid: true, message: "" };
}

/**
 * Remove a user's session token (on logout).
 */
export function removeUserSessionToken(username: string): void {
  const tokens = getSessionTokens();
  const filtered = tokens.filter((t) => t.username.toLowerCase() !== username.toLowerCase());
  saveSessionTokens(filtered);
  sessionStorage.removeItem("cryptoia_session_token");
}

/**
 * Get all active sessions (for admin dashboard).
 */
export function getActiveSessions(): SessionToken[] {
  const tokens = getSessionTokens();
  // Clean up sessions older than 24 hours
  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const active = tokens.filter((t) => t.last_active > cutoff);
  if (active.length !== tokens.length) {
    saveSessionTokens(active);
  }
  return active;
}

/**
 * Force disconnect a user (admin action).
 */
export function forceDisconnectUser(username: string): boolean {
  const tokens = getSessionTokens();
  const filtered = tokens.filter((t) => t.username.toLowerCase() !== username.toLowerCase());
  if (filtered.length === tokens.length) return false;
  saveSessionTokens(filtered);
  return true;
}

// ============================================================
// Visitor Tracking (lightweight, localStorage-based)
// ============================================================
const VISITOR_LOG_KEY = "cryptoia_visitor_log";

interface VisitorEntry {
  timestamp: string;
  page: string;
  referrer: string;
  userAgent: string;
  language: string;
  screenSize: string;
  isNewVisitor: boolean;
}

function getVisitorLog(): VisitorEntry[] {
  return getItem<VisitorEntry[]>(VISITOR_LOG_KEY, []);
}

function saveVisitorLog(log: VisitorEntry[]): void {
  setItem(VISITOR_LOG_KEY, log);
}

/** Track a page visit */
export function trackPageVisit(page: string): void {
  const log = getVisitorLog();
  const hasVisitedBefore = localStorage.getItem("cryptoia_returning_visitor") === "true";

  const entry: VisitorEntry = {
    timestamp: new Date().toISOString(),
    page,
    referrer: document.referrer || "direct",
    userAgent: navigator.userAgent,
    language: navigator.language,
    screenSize: `${screen.width}x${screen.height}`,
    isNewVisitor: !hasVisitedBefore,
  };

  if (!hasVisitedBefore) {
    localStorage.setItem("cryptoia_returning_visitor", "true");
  }

  log.unshift(entry);
  // Keep last 1000 entries
  if (log.length > 1000) log.length = 1000;
  saveVisitorLog(log);
}

/** Get visitor statistics for admin dashboard */
export function getVisitorStats() {
  const log = getVisitorLog();
  const now = new Date();

  // Today's visits
  const todayStr = now.toISOString().split("T")[0];
  const todayVisits = log.filter((v) => v.timestamp.startsWith(todayStr));

  // Last 7 days
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const weekVisits = log.filter((v) => new Date(v.timestamp) >= weekAgo);

  // Last 30 days
  const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const monthVisits = log.filter((v) => new Date(v.timestamp) >= monthAgo);

  // Unique visitors (by day, approximate)
  const uniqueDays = new Set(log.map((v) => v.timestamp.split("T")[0]));

  // Top pages
  const pageCounts: Record<string, number> = {};
  weekVisits.forEach((v) => {
    pageCounts[v.page] = (pageCounts[v.page] || 0) + 1;
  });
  const topPages = Object.entries(pageCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([page, count]) => ({ page, count }));

  // Referrer sources
  const refCounts: Record<string, number> = {};
  weekVisits.forEach((v) => {
    let source = "Direct";
    if (v.referrer && v.referrer !== "direct") {
      try {
        const url = new URL(v.referrer);
        source = url.hostname;
      } catch {
        source = v.referrer;
      }
    }
    refCounts[source] = (refCounts[source] || 0) + 1;
  });
  const topReferrers = Object.entries(refCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 8)
    .map(([source, count]) => ({ source, count }));

  // Languages
  const langCounts: Record<string, number> = {};
  weekVisits.forEach((v) => {
    const lang = v.language.split("-")[0].toUpperCase();
    langCounts[lang] = (langCounts[lang] || 0) + 1;
  });
  const topLanguages = Object.entries(langCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([lang, count]) => ({ lang, count }));

  // Daily visits for chart (last 7 days)
  const dailyVisits: { date: string; count: number; newVisitors: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    const dateStr = d.toISOString().split("T")[0];
    const dayVisits = log.filter((v) => v.timestamp.startsWith(dateStr));
    dailyVisits.push({
      date: dateStr,
      count: dayVisits.length,
      newVisitors: dayVisits.filter((v) => v.isNewVisitor).length,
    });
  }

  return {
    today: todayVisits.length,
    thisWeek: weekVisits.length,
    thisMonth: monthVisits.length,
    totalTracked: log.length,
    uniqueDays: uniqueDays.size,
    newVisitorsToday: todayVisits.filter((v) => v.isNewVisitor).length,
    topPages,
    topReferrers,
    topLanguages,
    dailyVisits,
  };
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