// Push Notification utility
const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) outputArray[i] = rawData.charCodeAt(i);
  return outputArray;
}

export async function isPushSupported() {
  return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
}

export async function getPushPermission() {
  if (!await isPushSupported()) return 'unsupported';
  return Notification.permission;
}

export async function registerPushNotifications() {
  if (!await isPushSupported()) return { success: false, reason: 'unsupported' };
  
  try {
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') return { success: false, reason: 'denied' };

    const registration = await navigator.serviceWorker.register('/sw.js');
    await navigator.serviceWorker.ready;

    // Get VAPID public key
    const res = await fetch(`${API}/push/vapid-key`);
    const { public_key } = await res.json();

    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(public_key)
    });

    // Send to backend
    await fetch(`${API}/push/subscribe`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ subscription: subscription.toJSON() })
    });

    return { success: true };
  } catch (err) {
    console.error('Push registration failed:', err);
    return { success: false, reason: err.message };
  }
}

export async function unregisterPushNotifications() {
  try {
    const registration = await navigator.serviceWorker.getRegistration('/sw.js');
    if (registration) {
      const sub = await registration.pushManager.getSubscription();
      if (sub) await sub.unsubscribe();
    }
    await fetch(`${API}/push/unsubscribe`, { method: 'POST', credentials: 'include' });
    return true;
  } catch { return false; }
}
