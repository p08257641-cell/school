export const urlBase64ToUint8Array = (base64String: string) => {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
};

export const subscribeToPush = async (publicVapidKey: string) => {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    console.error('Push messaging is not supported in this browser');
    return null;
  }

  try {
    // Explicitly request permission first
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      console.warn('Notification permission denied');
      return null;
    }

    // Ensure service worker is registered and ready
    // We try to find the active registration
    let registration = await navigator.serviceWorker.getRegistration();
    
    if (!registration) {
      console.log('No SW registration found, registering now...');
      registration = await navigator.serviceWorker.register('/sw.js');
    }

    // Wait for the service worker to be ready
    await navigator.serviceWorker.ready;
    
    // Check if we already have a subscription
    const existingSubscription = await registration.pushManager.getSubscription();
    if (existingSubscription) {
      console.log('Using existing subscription');
      return existingSubscription;
    }

    console.log('Creating new push subscription...');
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicVapidKey)
    });

    return subscription;
  } catch (error) {
    console.error('Subscription process failed:', error);
    return null;
  }
};
