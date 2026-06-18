/**
 * Lightweight analytics tracker.
 * Sends events to backend /api/v1/analytics/track (fire & forget — never blocks UI).
 *
 * Usage: trackEvent("popup_shown", { source: "homepage" })
 */

type EventName =
  | "popup_shown"
  | "popup_copy_code"
  | "popup_cta_click"
  | "popup_dismiss"
  | "promo_applied"
  | "promo_invalid"
  | "affiliate_generated"
  | "affiliate_link_copied"
  | "onboarding_started"
  | "onboarding_completed"
  | "onboarding_skipped"
  | "onboarding_cta_click"
  | "testimonial_cta_click"
  | "email_welcome_sent"
  | "email_welcome_failed"
  | "signup_started"
  | "signup_completed"
  // ─── Conversion funnel (Session 17) ───
  | "pricing_page_viewed"
  | "plan_selected"
  | "billing_period_changed"
  | "checkout_started"
  | "checkout_failed"
  | "checkout_method_chosen"
  | "payment_completed"
  | "payment_failed"
  | "blog_article_viewed"
  | "leaderboard_viewed";

export function trackEvent(event: EventName, meta?: Record<string, unknown>): void {
  if (typeof window === "undefined") return;
  try {
    // Use sendBeacon when available (survives page unload)
    const url = "/api/v1/analytics/track";
    const payload = JSON.stringify({ event, meta: meta || {} });

    if (navigator.sendBeacon) {
      const blob = new Blob([payload], { type: "application/json" });
      navigator.sendBeacon(url, blob);
      return;
    }

    // Fallback: fetch with keepalive
    fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: payload,
      keepalive: true,
    }).catch(() => {
      // ignore — never throw, never block
    });
  } catch {
    // ignore — analytics never crashes the app
  }
}
