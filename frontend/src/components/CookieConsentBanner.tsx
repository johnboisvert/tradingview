// Cookie Consent Banner — GDPR-compliant, gates analytics tracking
import { useEffect, useState } from "react";
import { Cookie, X } from "lucide-react";
import { useTranslation } from "react-i18next";

const CONSENT_KEY = "cryptoia_cookie_consent_v1";

export type ConsentStatus = "accepted" | "rejected" | null;

export function getConsentStatus(): ConsentStatus {
  try {
    const v = localStorage.getItem(CONSENT_KEY);
    if (v === "accepted" || v === "rejected") return v;
  } catch {}
  return null;
}

export function hasAnalyticsConsent(): boolean {
  return getConsentStatus() === "accepted";
}

export default function CookieConsentBanner() {
  const { t, i18n } = useTranslation();
  const lang = i18n.resolvedLanguage?.startsWith("en") ? "en" : "fr";
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Show after small delay to avoid flash on initial load
    const t = setTimeout(() => {
      if (getConsentStatus() === null) setVisible(true);
    }, 800);
    return () => clearTimeout(t);
  }, []);

  const setConsent = (status: "accepted" | "rejected") => {
    try { localStorage.setItem(CONSENT_KEY, status); } catch {}
    // Dispatch a custom event so analytics module can react
    window.dispatchEvent(new CustomEvent("cookie-consent-changed", { detail: status }));
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      data-testid="cookie-consent-banner"
      className="fixed bottom-4 left-4 right-4 md:left-auto md:right-6 md:bottom-6 md:max-w-md z-[100] rounded-2xl border border-white/10 bg-[#0b0b14]/95 backdrop-blur-xl shadow-2xl shadow-black/50 p-4 md:p-5 animate-in fade-in slide-in-from-bottom-4"
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/30 flex items-center justify-center">
          <Cookie className="w-4 h-4 text-amber-300" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-black text-white mb-1">
            {lang === "en" ? "Cookies & privacy" : "Cookies & confidentialité"}
          </h3>
          <p className="text-xs text-gray-400 leading-relaxed mb-3">
            {lang === "en"
              ? "We use anonymized cookies to measure traffic and improve the experience. No personal data is shared."
              : "Nous utilisons des cookies anonymisés pour mesurer le trafic et améliorer l'expérience. Aucune donnée personnelle n'est partagée."}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setConsent("accepted")}
              data-testid="cookie-consent-accept"
              className="flex-1 px-3 py-2 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-xs font-bold hover:scale-[1.02] transition-transform"
            >
              {lang === "en" ? "Accept" : "Accepter"}
            </button>
            <button
              onClick={() => setConsent("rejected")}
              data-testid="cookie-consent-reject"
              className="flex-1 px-3 py-2 rounded-lg bg-white/[0.06] border border-white/10 text-gray-300 text-xs font-bold hover:bg-white/[0.1] transition-colors"
            >
              {lang === "en" ? "Reject" : "Refuser"}
            </button>
          </div>
        </div>
        <button
          onClick={() => setConsent("rejected")}
          aria-label="Close"
          className="flex-shrink-0 p-1 rounded-full hover:bg-white/10 transition-colors -mr-1 -mt-1"
        >
          <X className="w-3.5 h-3.5 text-gray-500" />
        </button>
      </div>
    </div>
  );
}
