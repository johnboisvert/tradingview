/**
 * PWA Push Notifications — Helper frontend
 * VAPID public key fetched from backend (/api/v1/push/vapid-public) to avoid build-time coupling.
 */

let _vapidKey: string | null = null;

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  return new Uint8Array([...rawData].map((c) => c.charCodeAt(0)));
}

async function getVapidKey(): Promise<string> {
  if (_vapidKey) return _vapidKey;
  // Fallback to env var if backend unavailable
  const envKey = (import.meta as any).env?.VITE_VAPID_PUBLIC_KEY || "";
  try {
    const r = await fetch("/api/v1/push/vapid-public");
    const j = await r.json();
    if (j.publicKey) { _vapidKey = j.publicKey; return _vapidKey; }
  } catch {}
  _vapidKey = envKey;
  return _vapidKey;
}

export function isPushSupported(): boolean {
  if (typeof window === "undefined") return false;
  return "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
}

export async function askPushPermission(): Promise<boolean> {
  if (!isPushSupported()) return false;
  if (Notification.permission === "granted") return true;
  if (Notification.permission === "denied") return false;
  const result = await Notification.requestPermission();
  return result === "granted";
}

export async function getCurrentSubscription(): Promise<PushSubscription | null> {
  if (!isPushSupported()) return null;
  try {
    const reg = await navigator.serviceWorker.ready;
    return await reg.pushManager.getSubscription();
  } catch {
    return null;
  }
}

export async function subscribeUserToPush(userKey?: string, topics?: string[]): Promise<boolean> {
  if (!isPushSupported()) return false;
  const vapidKey = await getVapidKey();
  if (!vapidKey) {
    console.warn("[Push] VAPID key missing — push disabled on this server");
    return false;
  }
  try {
    const reg = await navigator.serviceWorker.ready;
    let subscription = await reg.pushManager.getSubscription();
    if (!subscription) {
      subscription = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey),
      });
    }
    const res = await fetch("/api/v1/push/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subscription, userKey, topics }),
    });
    return res.ok;
  } catch (e) {
    console.error("[Push] subscribe error:", e);
    return false;
  }
}

export async function unsubscribeUserFromPush(): Promise<boolean> {
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

// Backward-compat alias
export const unsubscribeFromPush = unsubscribeUserFromPush;
