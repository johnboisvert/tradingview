/**
 * Affiliation tracking helpers
 * - Capture ?ref=CODE from URL on first visit
 * - Store in cookie (90 days) + localStorage for redundancy
 * - Read it later to attach to signup/payment events
 */

const COOKIE_NAME = "cryptoia_ref";
const STORAGE_KEY = "cryptoia_ref";
const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 90; // 90 days

function setCookie(name: string, value: string, maxAgeSeconds: number) {
  if (typeof document === "undefined") return;
  const expires = new Date(Date.now() + maxAgeSeconds * 1000).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`;
}

function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.split("; ").find((r) => r.startsWith(`${name}=`));
  return match ? decodeURIComponent(match.split("=")[1]) : null;
}

/**
 * Read ?ref=CODE from URL once on app load and persist it.
 * Call this from your top-level App or Index.
 */
export function captureRefFromUrl(): void {
  if (typeof window === "undefined") return;
  try {
    const params = new URLSearchParams(window.location.search);
    const ref = (params.get("ref") || "").trim().toUpperCase();
    if (!ref || ref.length < 4 || ref.length > 20 || !/^[A-Z0-9]+$/.test(ref)) return;

    // Don't overwrite an existing ref (first one wins)
    if (getStoredRefCode()) return;

    setCookie(COOKIE_NAME, ref, COOKIE_MAX_AGE_SECONDS);
    localStorage.setItem(STORAGE_KEY, ref);

    // Fire-and-forget tracking to backend
    fetch("/api/v1/affiliation/click", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: ref, ts: new Date().toISOString() }),
      keepalive: true,
    }).catch(() => { /* ignore */ });
  } catch {
    // never crash the app
  }
}

/** Get the currently-stored ref code (or null). */
export function getStoredRefCode(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(STORAGE_KEY) || getCookie(COOKIE_NAME);
  } catch {
    return null;
  }
}

/** Clear after a successful conversion (avoid re-attribution). */
export function clearRefCode(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(STORAGE_KEY);
    setCookie(COOKIE_NAME, "", 0);
  } catch { /* ignore */ }
}
