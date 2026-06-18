// Sentry instrumentation — MUST be loaded BEFORE server.js
// Run with: node --import ./instrument.mjs server.js
// Quotas (free tier): 5k errors/mo, 5M spans/mo
import * as Sentry from "@sentry/node";

const DSN = process.env.SENTRY_DSN_BACKEND || process.env.SENTRY_DSN || "";

if (DSN) {
  Sentry.init({
    dsn: DSN,
    environment: process.env.NODE_ENV || "production",
    release: process.env.RAILWAY_GIT_COMMIT_SHA || process.env.SENTRY_RELEASE,

    // Tracing — 10% sample rate to stay within 5M spans/mo
    tracesSampleRate: Number(process.env.SENTRY_TRACES_SAMPLE_RATE || 0.1),

    // GDPR / PII hardening
    sendDefaultPii: false,

    // Strip sensitive data before sending
    beforeSend(event) {
      try {
        if (event.request?.url) {
          event.request.url = event.request.url.replace(
            /([?&])(token|key|api_key|password|email|secret)=[^&]+/gi,
            "$1$2=[REDACTED]"
          );
        }
        if (event.request?.headers) {
          delete event.request.headers.authorization;
          delete event.request.headers.cookie;
          delete event.request.headers["x-api-key"];
          delete event.request.headers["stripe-signature"];
        }
        // Strip Stripe/Resend/Telegram body content
        if (event.request?.data && typeof event.request.data === "object") {
          for (const k of ["password", "token", "api_key", "secret", "card", "cvc"]) {
            if (k in event.request.data) event.request.data[k] = "[REDACTED]";
          }
        }
      } catch { /* noop */ }
      return event;
    },

    // Ignore noisy expected errors
    ignoreErrors: [
      "ECONNRESET",
      "EPIPE",
      "ETIMEDOUT",
      /CoinGecko.*timeout/i,
      /aborted/i,
    ],
  });
  console.log("[Sentry] ✅ Backend monitoring initialized");
} else {
  console.log("[Sentry] ⏭️ SENTRY_DSN_BACKEND not set — skipping");
}
