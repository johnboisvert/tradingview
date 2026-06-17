import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Bell, BellOff, Loader2 } from "lucide-react";
import { isPushSupported, askPushPermission, subscribeUserToPush, unsubscribeUserFromPush, getCurrentSubscription } from "@/lib/push";

/**
 * PushSubscribeButton — floating-style toggle button to enable/disable push notifications.
 * Auto-hides if browser doesn't support push or if VAPID public key is missing.
 */
export default function PushSubscribeButton({ className = "" }: { className?: string }) {
  const { t, i18n } = useTranslation();
  const lang = i18n.resolvedLanguage?.startsWith("en") ? "en" : "fr";
  const [supported, setSupported] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [vapidAvailable, setVapidAvailable] = useState(false);

  useEffect(() => {
    let mounted = true;
    setSupported(isPushSupported());
    // Check if backend has VAPID configured
    fetch("/api/v1/push/vapid-public")
      .then((r) => r.json())
      .then((j) => { if (mounted) setVapidAvailable(!!j.enabled && !!j.publicKey); })
      .catch(() => {});
    // Check current subscription state
    getCurrentSubscription().then((sub) => { if (mounted) setSubscribed(!!sub); });
    return () => { mounted = false; };
  }, []);

  if (!supported || !vapidAvailable) return null;

  const handleToggle = async () => {
    setLoading(true);
    try {
      if (subscribed) {
        await unsubscribeUserFromPush();
        setSubscribed(false);
      } else {
        const ok = await askPushPermission();
        if (ok) {
          const ok2 = await subscribeUserToPush();
          if (ok2) setSubscribed(true);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleToggle}
      disabled={loading}
      data-testid="push-subscribe-btn"
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all disabled:opacity-50 ${
        subscribed
          ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/25"
          : "bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 hover:bg-indigo-500/25"
      } ${className}`}
      title={subscribed ? (lang === "en" ? "Disable push notifications" : "Désactiver les notifications") : (lang === "en" ? "Enable push notifications" : "Activer les notifications")}
    >
      {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : subscribed ? <Bell className="w-3.5 h-3.5" /> : <BellOff className="w-3.5 h-3.5" />}
      <span className="hidden sm:inline">
        {subscribed
          ? (lang === "en" ? "Notifications on" : "Notifs activées")
          : (lang === "en" ? "Enable notifications" : "Activer notifs")}
      </span>
    </button>
  );
}
