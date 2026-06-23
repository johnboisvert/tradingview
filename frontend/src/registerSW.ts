/**
 * Service Worker registration for CryptoIA PWA + auto-update flow.
 *
 * When a new sw.js is deployed, the browser installs it as the "waiting"
 * worker. We dispatch a `cryptoia:sw-update-available` window event so the
 * UpdateBanner component can prompt the user to reload — no more stale
 * bundles after a deploy (e.g. the AdminOnboarding cache miss bug).
 */

export type UpdateAvailableDetail = {
  waitingWorker: ServiceWorker;
};

const UPDATE_EVENT = 'cryptoia:sw-update-available';

function dispatchUpdate(waitingWorker: ServiceWorker) {
  window.dispatchEvent(
    new CustomEvent<UpdateAvailableDetail>(UPDATE_EVENT, { detail: { waitingWorker } })
  );
}

export function registerServiceWorker(): void {
  if (!('serviceWorker' in navigator)) {
    console.info('[PWA] Service Workers not supported in this browser');
    return;
  }
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js', { scope: '/' })
      .then((registration) => {
        console.log('[PWA] Service Worker registered:', registration.scope);

        // If a waiting worker already exists (e.g. previous tab installed it), surface it.
        if (registration.waiting && navigator.serviceWorker.controller) {
          dispatchUpdate(registration.waiting);
        }

        // Watch for new updates being installed in the background
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (!newWorker) return;
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              console.log('[PWA] New version available — prompting user to reload');
              dispatchUpdate(newWorker);
            }
          });
        });

        // Poll for updates every 30 min while the tab stays open
        setInterval(() => registration.update().catch(() => undefined), 30 * 60 * 1000);
      })
      .catch((error) => {
        console.warn('[PWA] Service Worker registration failed:', error);
      });

    // When the new SW takes control, reload once so the user gets fresh assets
    let reloading = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (reloading) return;
      reloading = true;
      window.location.reload();
    });
  });
}

export function unregisterServiceWorker(): void {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready
      .then((registration) => registration.unregister())
      .catch((error) => console.error(error));
  }
}

export const SW_UPDATE_EVENT = UPDATE_EVENT;
