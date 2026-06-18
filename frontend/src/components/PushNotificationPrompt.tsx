// Push Notification Prompt — engaging UI to ask user to subscribe to web push
// Shows after 35s of session OR 40% scroll, persists dismissal for 14 days.
// Auto-hides if: push unsupported, no VAPID, already subscribed, or recently dismissed.
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Bell, X, Sparkles, Loader2 } from "lucide-react";
import {
  isPushSupported,
  askPushPermission,
  subscribeUserToPush,
  getCurrentSubscription,
} from "@/lib/push";
import { hasAnalyticsConsent } from "./CookieConsentBanner";

const DISMISS_KEY = "cryptoia_push_prompt_dismissed_v1";
const DISMISS_DAYS = 14;

function wasRecentlyDismissed(): boolean {
  try {
    const ts = localStorage.getItem(DISMISS_KEY);
    if (!ts) return false;
    const age = Date.now() - Number(ts);
    return age < DISMISS_DAYS * 24 * 60 * 60 * 1000;
  } catch {
    return false;
  }
}

export default function PushNotificationPrompt() {
  const { i18n } = useTranslation();
  const lang = i18n.resolvedLanguage?.startsWith("en") ? "en" : "fr";
  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [vapidAvailable, setVapidAvailable] = useState(false);

  useEffect(() => {
    let mounted = true;

    // Quick exit conditions
    if (!isPushSupported()) return;
    if (wasRecentlyDismissed()) return;
    if (typeof Notification !== "undefined" && Notification.permission === "denied") return;

    // Wait for cookie consent (avoid stacking banners)
    if (!hasAnalyticsConsent()) {
      // Re-check after 10s in case user accepts
      const recheck = setTimeout(() => {
        if (mounted && hasAnalyticsConsent()) setupTriggers();
      }, 10_000);
      return () => { mounted = false; clearTimeout(recheck); };
    }

    setupTriggers();

    function setupTriggers() {
      // Check backend VAPID + current subscription state
      Promise.all([
        fetch("/api/v1/push/vapid-public").then((r) => r.json()).catch(() => ({})),
        getCurrentSubscription(),
      ]).then(([vapid, sub]) => {
        if (!mounted) return;
        const vapidOk = !!vapid?.enabled && !!vapid?.publicKey;
        setVapidAvailable(vapidOk);
        if (!vapidOk || sub) return; // already subscribed or backend not configured

        // Trigger 1: 35s timer
        const timer = setTimeout(() => mounted && setVisible(true), 35_000);

        // Trigger 2: 40% scroll
        const onScroll = () => {
          const scrolled = window.scrollY / (document.documentElement.scrollHeight - window.innerHeight);
          if (scrolled > 0.4) {
            window.removeEventListener("scroll", onScroll);
            clearTimeout(timer);
            if (mounted) setVisible(true);
          }
        };
        window.addEventListener("scroll", onScroll, { passive: true });
      });
    }

    return () => { mounted = false; };
  }, []);

  const handleDismiss = () => {
    try { localStorage.setItem(DISMISS_KEY, String(Date.now())); } catch {}
    setVisible(false);
  };

  const handleSubscribe = async () => {
    setLoading(true);
    try {
      const granted = await askPushPermission();
      if (!granted) {
        handleDismiss();
        return;
      }
      const ok = await subscribeUserToPush();
      if (ok) {
        // Success — silently close (no toast spam)
        setVisible(false);
      } else {
        handleDismiss();
      }
    } finally {
      setLoading(false);
    }
  };

  if (!visible || !vapidAvailable) return null;

  return (
    <div
      data-testid="push-notification-prompt"
      className="fixed bottom-4 right-4 z-[60] max-w-sm w-[calc(100%-2rem)] sm:w-96 animate-in slide-in-from-bottom-4 fade-in duration-500"
    >
      <div className="relative rounded-2xl bg-gradient-to-br from-indigo-950/95 via-purple-950/95 to-slate-950/95 backdrop-blur-xl border border-indigo-500/30 shadow-2xl shadow-indigo-500/20 p-5">
        {/* Close button */}
        <button
          onClick={handleDismiss}
          data-testid="push-prompt-dismiss"
          aria-label={lang === "en" ? "Dismiss" : "Fermer"}
          className="absolute top-3 right-3 text-gray-500 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/5"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Icon + Title */}
        <div className="flex items-start gap-3 mb-3">
          <div className="relative flex-shrink-0">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/40">
              <Bell className="w-5 h-5 text-white" />
            </div>
            <Sparkles className="absolute -top-1 -right-1 w-3.5 h-3.5 text-yellow-300 animate-pulse" />
          </div>
          <div className="flex-1 pr-6">
            <h3 className="text-sm font-black text-white leading-tight mb-1">
              {lang === "en"
                ? "Never miss a high-confidence AI signal"
                : "Ne ratez plus aucun signal IA à haute confiance"}
            </h3>
            <p className="text-[11px] text-indigo-200/80 leading-snug">
              {lang === "en"
                ? "Get instant browser alerts on validated scalp & range setups (≥85% confidence)."
                : "Recevez des alertes navigateur instantanées sur les setups scalp & range validés (confiance ≥85 %)."}
            </p>
          </div>
        </div>

        {/* Benefits list */}
        <ul className="mb-4 space-y-1.5 text-[11px] text-gray-300">
          <li className="flex items-center gap-2">
            <span className="w-1 h-1 rounded-full bg-emerald-400" />
            {lang === "en" ? "Free, no email required" : "Gratuit, aucun email requis"}
          </li>
          <li className="flex items-center gap-2">
            <span className="w-1 h-1 rounded-full bg-emerald-400" />
            {lang === "en" ? "One-click unsubscribe anytime" : "Désactivation en un clic à tout moment"}
          </li>
          <li className="flex items-center gap-2">
            <span className="w-1 h-1 rounded-full bg-emerald-400" />
            {lang === "en" ? "Works even when CryptoIA is closed" : "Fonctionne même quand CryptoIA est fermé"}
          </li>
        </ul>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleSubscribe}
            disabled={loading}
            data-testid="push-prompt-accept"
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black text-white bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 transition-all shadow-lg shadow-indigo-500/30 disabled:opacity-60 disabled:cursor-wait"
          >
            {loading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                {lang === "en" ? "Activating..." : "Activation..."}
              </>
            ) : (
              <>
                <Bell className="w-3.5 h-3.5" />
                {lang === "en" ? "Enable notifications" : "Activer les notifications"}
              </>
            )}
          </button>
          <button
            onClick={handleDismiss}
            data-testid="push-prompt-later"
            className="px-3 py-2.5 rounded-xl text-xs font-bold text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
          >
            {lang === "en" ? "Later" : "Plus tard"}
          </button>
        </div>
      </div>
    </div>
  );
}
