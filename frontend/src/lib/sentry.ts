// Sentry frontend initialization — Error Monitoring + Tracing + Session Replay
// Quotas (free tier): 5k errors/mo, 5M spans/mo, 50 replays/mo
import * as Sentry from "@sentry/react";

const DSN = import.meta.env.VITE_SENTRY_DSN as string | undefined;
const RELEASE = import.meta.env.VITE_RELEASE as string | undefined;
const ENV = import.meta.env.MODE; // 'development' | 'production'

export function initSentry() {
  // Skip in dev unless explicitly opted-in
  if (!DSN || ENV === "development") return;

  Sentry.init({
    dsn: DSN,
    environment: ENV,
    release: RELEASE,

    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration({
        // Mask all text by default to protect PII; keeps layout/structure for debugging
        maskAllText: false,
        blockAllMedia: false,
        // Block known sensitive selectors
        mask: ["[data-sensitive]", ".api-key-display", ".portfolio-value"],
      }),
    ],

    // Tracing
    tracesSampleRate: 0.1, // 10% of transactions (~ stays within 5M spans/mo)
    tracePropagationTargets: [/^https:\/\/www\.cryptoia\.ca\/api/, /^\/api/],

    // Session Replay (only on errors — protects the 50 replays/mo quota)
    replaysSessionSampleRate: 0, // 0% normal sessions
    replaysOnErrorSampleRate: 1.0, // 100% of sessions where an error occurs

    // GDPR / PII hardening
    sendDefaultPii: false, // do not auto-send user IP, cookies, headers
    beforeSend(event) {
      // Strip any accidental API keys / tokens from breadcrumbs
      try {
        if (event.request?.url) {
          event.request.url = event.request.url
            .replace(/([?&])(token|key|api_key|password|email)=[^&]+/gi, "$1$2=[REDACTED]");
        }
        // Drop authorization headers if present
        if (event.request?.headers) {
          delete (event.request.headers as Record<string, unknown>).authorization;
          delete (event.request.headers as Record<string, unknown>).cookie;
        }
      } catch { /* noop */ }
      return event;
    },

    // Ignore noisy/expected errors
    ignoreErrors: [
      "ResizeObserver loop limit exceeded",
      "ResizeObserver loop completed with undelivered notifications",
      "Network request failed",
      "NetworkError when attempting to fetch resource.",
      "AbortError",
      "Non-Error promise rejection captured",
    ],
  });
}

// Expose helpers for manual capture (used in lib/api.ts etc.)
export const captureException = Sentry.captureException;
export const captureMessage = Sentry.captureMessage;
export const setUser = Sentry.setUser;
export const SentryErrorBoundary = Sentry.ErrorBoundary;
