/**
 * PWA Push Notifications — Helper frontend
 *
 * ⚠️ Activation nécessite des clés VAPID. Voir SESSION7_PUSH_README.md
 *
 * Usage simple :
 *   import { askPushPermission, subscribeUserToPush } from "@/lib/push";
 *   const ok = await askPushPermission();
 *   if (ok) await subscribeUserToPush();
 */

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY || "";

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  return new Uint8Array([...rawData].map((c) => c.charCodeAt(0)));
}

/** Vérifie si les push sont supportés par le navigateur */
export function isPushSupported(): boolean {
  if (typeof window === "undefined") return false;
  return "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
}

/** Demande la permission de notifications. Retourne true si accordée. */
export async function askPushPermission(): Promise<boolean> {
  if (!isPushSupported()) return false;
  if (Notification.permission === "granted") return true;
  if (Notification.permission === "denied") return false;
  const result = await Notification.requestPermission();
  return result === "granted";
}

/** Inscrit l'utilisateur aux push notifs. Envoie la subscription au backend. */
export async function subscribeUserToPush(): Promise<boolean> {
  if (!isPushSupported() || !VAPID_PUBLIC_KEY) {
    console.warn("[Push] Not supported or VAPID key missing");
    return false;
  }
  try {
    const reg = await navigator.serviceWorker.ready;
    let subscription = await reg.pushManager.getSubscription();
    if (!subscription) {
      subscription = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });
    }
    // Send subscription to backend
    const res = await fetch("/api/v1/push/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(subscription),
    });
    return res.ok;
  } catch (e) {
    console.error("[Push] subscribe error:", e);
    return false;
  }
}

/** Désinscrit l'utilisateur des push */
export async function unsubscribeFromPush(): Promise<boolean> {
  if (!isPushSupported()) return false;
  try {
    const reg = await navigator.serviceWorker.ready;
    const subscription = await reg.pushManager.getSubscription();
    if (subscription) {
      await subscription.unsubscribe();
      await fetch("/api/v1/push/unsubscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ endpoint: subscription.endpoint }),
      });
    }
    return true;
  } catch (e) {
    console.error("[Push] unsubscribe error:", e);
    return false;
  }
}
