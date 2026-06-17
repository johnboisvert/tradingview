// Gamification client helpers — XP, badges, leaderboard.
// User identity is derived from localStorage (email if connected, else anonymous device id).

const USER_KEY_LS = "cryptoia_user_key";
const ANON_PREFIX = "anon-";

export type BadgeMeta = {
  id: string;
  name: string;
  name_en: string;
  emoji: string;
  rarity: "common" | "rare" | "epic" | "legendary";
  xp: number;
  desc_fr: string;
  desc_en: string;
};

export type UserBadge = { id: string; unlockedAt: string };

export type UserStats = {
  xp: number;
  badges: UserBadge[];
  displayName: string;
  level: number;
  currentLevelXp: number;
  nextLevelXp: number;
  createdAt?: string;
  lastActivity?: string;
};

export type LeaderboardRow = {
  anonKey: string;
  displayName: string;
  xp: number;
  level: number;
  badges: number;
  lastActivity: string;
};

export function getUserKey(): string {
  // Prefer email from session (if logged in), else stored anon key
  try {
    const session = localStorage.getItem("cryptoia_user");
    if (session) {
      const u = JSON.parse(session);
      if (u?.email) return String(u.email).toLowerCase();
    }
  } catch {}
  let key = localStorage.getItem(USER_KEY_LS);
  if (!key) {
    key = ANON_PREFIX + Math.random().toString(36).slice(2, 10);
    localStorage.setItem(USER_KEY_LS, key);
  }
  return key;
}

export function getDisplayName(): string {
  try {
    const session = localStorage.getItem("cryptoia_user");
    if (session) {
      const u = JSON.parse(session);
      if (u?.username) return String(u.username);
      if (u?.email) return String(u.email).split("@")[0];
    }
  } catch {}
  return "Anonymous";
}

const API = "";

export async function fetchCatalog(): Promise<BadgeMeta[]> {
  try {
    const r = await fetch(`${API}/api/v1/gamification/catalog`);
    const j = await r.json();
    return j.badges || [];
  } catch { return []; }
}

export async function fetchStats(): Promise<UserStats | null> {
  try {
    const r = await fetch(`${API}/api/v1/gamification/stats/${encodeURIComponent(getUserKey())}`);
    const j = await r.json();
    return j.user;
  } catch { return null; }
}

export async function fetchLeaderboard(limit = 100): Promise<LeaderboardRow[]> {
  try {
    const r = await fetch(`${API}/api/v1/gamification/leaderboard?limit=${limit}`);
    const j = await r.json();
    return j.leaderboard || [];
  } catch { return []; }
}

export async function unlockBadge(badgeId: string): Promise<{ ok: boolean; alreadyUnlocked?: boolean; badge?: BadgeMeta; newXp?: number; level?: number }> {
  try {
    const r = await fetch(`${API}/api/v1/gamification/unlock`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userKey: getUserKey(), badgeId, displayName: getDisplayName() }),
    });
    return await r.json();
  } catch { return { ok: false }; }
}

export async function addXP(action: string, xp: number): Promise<{ ok: boolean; newXp?: number; level?: number }> {
  try {
    const r = await fetch(`${API}/api/v1/gamification/xp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userKey: getUserKey(), action, xp, displayName: getDisplayName() }),
    });
    return await r.json();
  } catch { return { ok: false }; }
}

export const RARITY_COLORS: Record<string, { bg: string; border: string; text: string; glow: string }> = {
  common:    { bg: "from-slate-500/15 to-slate-600/15", border: "border-slate-400/30", text: "text-slate-300", glow: "rgba(148,163,184,0.25)" },
  rare:      { bg: "from-blue-500/15 to-cyan-600/15",   border: "border-blue-400/40",  text: "text-blue-300",  glow: "rgba(59,130,246,0.35)" },
  epic:      { bg: "from-purple-500/15 to-fuchsia-600/15", border: "border-purple-400/40", text: "text-purple-300", glow: "rgba(168,85,247,0.4)" },
  legendary: { bg: "from-amber-400/15 to-orange-600/15", border: "border-amber-400/50", text: "text-amber-300", glow: "rgba(245,158,11,0.45)" },
};
