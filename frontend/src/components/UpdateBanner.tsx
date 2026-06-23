/**
 * UpdateBanner — sticky banner that appears when a new service worker
 * version has been installed and is waiting. Lets the user opt-in to the
 * upgrade with a single click (no more silent stale-cache bugs after deploys).
 *
 * Driven by the `cryptoia:sw-update-available` window event dispatched
 * from src/registerSW.ts.
 */

import { useEffect, useState } from "react";
import { Sparkles, RefreshCw, X } from "lucide-react";
import { SW_UPDATE_EVENT, type UpdateAvailableDetail } from "@/registerSW";

const DISMISS_KEY = "cryptoia_sw_update_dismissed_at";
const DISMISS_TTL_MS = 24 * 60 * 60 * 1000; // 24h

export default function UpdateBanner() {
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    // Respect a recent dismissal so we don't nag every reload
    const dismissedAt = Number(localStorage.getItem(DISMISS_KEY) || 0);
    const recentlyDismissed = Date.now() - dismissedAt < DISMISS_TTL_MS;

    const handler = (e: Event) => {
      const detail = (e as CustomEvent<UpdateAvailableDetail>).detail;
      if (!detail?.waitingWorker) return;
      if (recentlyDismissed) {
        console.log("[UpdateBanner] Update available but recently dismissed — skipping");
        return;
      }
      setWaitingWorker(detail.waitingWorker);
    };

    window.addEventListener(SW_UPDATE_EVENT, handler);
    return () => window.removeEventListener(SW_UPDATE_EVENT, handler);
  }, []);

  if (!waitingWorker) return null;

  const applyUpdate = () => {
    setUpdating(true);
    // Tell the waiting SW to activate; the `controllerchange` listener in
    // registerSW.ts will trigger a single page reload once it takes control.
    waitingWorker.postMessage({ type: "SKIP_WAITING" });
  };

  const dismiss = () => {
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
    setWaitingWorker(null);
  };

  return (
    <div
      role="status"
      data-testid="sw-update-banner"
      className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[9999] w-[min(94vw,560px)] rounded-2xl border border-indigo-500/30 bg-gradient-to-r from-indigo-600/95 via-purple-600/95 to-pink-600/95 shadow-2xl backdrop-blur-xl px-4 py-3 flex items-center gap-3 animate-in slide-in-from-bottom-4 fade-in duration-300"
    >
      <div className="shrink-0 w-9 h-9 rounded-full bg-white/15 flex items-center justify-center">
        <Sparkles className="w-4 h-4 text-white" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-black text-white leading-tight">
          Nouvelle version disponible
        </p>
        <p className="text-[11px] text-white/80 leading-snug mt-0.5">
          Mets à jour pour les dernières fonctionnalités et corrections.
        </p>
      </div>
      <button
        onClick={applyUpdate}
        disabled={updating}
        data-testid="sw-update-apply"
        className="shrink-0 px-3 py-1.5 rounded-lg bg-white text-indigo-700 text-xs font-black flex items-center gap-1.5 hover:bg-indigo-50 disabled:opacity-60 transition-colors"
      >
        <RefreshCw className={`w-3.5 h-3.5 ${updating ? "animate-spin" : ""}`} />
        {updating ? "Mise à jour…" : "Mettre à jour"}
      </button>
      <button
        onClick={dismiss}
        data-testid="sw-update-dismiss"
        aria-label="Plus tard"
        className="shrink-0 w-7 h-7 rounded-lg hover:bg-white/15 flex items-center justify-center text-white/80 hover:text-white transition-colors"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
