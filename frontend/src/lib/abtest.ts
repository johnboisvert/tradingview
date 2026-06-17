/**
 * A/B Testing — Lightweight variant manager.
 * - Assigns user to a variant on first visit (persisted in localStorage)
 * - Same user always sees the same variant (consistent UX)
 * - Tracks exposure + conversions via analytics events
 *
 * Usage:
 *   const variant = getVariant("hero_cta", ["A", "B"]);
 *   if (variant === "A") <Hero1/> else <Hero2/>
 *
 *   // On conversion:
 *   trackVariantConversion("hero_cta");
 */
import { trackEvent } from "./analytics";

const STORAGE_PREFIX = "cryptoia_ab_";

export function getVariant<T extends string>(testName: string, variants: readonly T[]): T {
  if (typeof window === "undefined") return variants[0];
  if (variants.length === 0) return variants[0];
  const key = STORAGE_PREFIX + testName;
  try {
    const stored = localStorage.getItem(key);
    if (stored && variants.includes(stored as T)) return stored as T;
    const idx = Math.floor(Math.random() * variants.length);
    const picked = variants[idx];
    localStorage.setItem(key, picked);
    // Track exposure (only once per user per test)
    trackEvent("popup_shown", { ab_test: testName, ab_variant: picked });
    return picked;
  } catch {
    return variants[0];
  }
}

export function getCurrentVariant(testName: string): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(STORAGE_PREFIX + testName);
  } catch {
    return null;
  }
}

export function trackVariantConversion(testName: string, meta?: Record<string, unknown>): void {
  const variant = getCurrentVariant(testName);
  if (!variant) return;
  trackEvent("popup_cta_click", { ab_test: testName, ab_variant: variant, ...(meta || {}) });
}
