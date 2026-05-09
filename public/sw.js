self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

self.addEventListener('push', (event) => {
  console.log('>>> [SW] Push event received');
  if (!event.data) {
    console.warn('>>> [SW] Push event has no data');
    return;
  }

  try {
    const data = event.data.json();
    console.log('>>> [SW] Payload:', data);
    
    const title = data.notification?.title || 'SchoolGo Alert';
    const options = {
      body: data.notification?.body || 'New message from SchoolGo',
      icon: data.notification?.icon || '/vite.svg',
      badge: data.notification?.badge || '/vite.svg',
      vibrate: [100, 50, 100],
      data: data.notification?.data || {},
      actions: [
        { action: 'open', title: 'Open App' }
      ]
    };

    event.waitUntil(
      self.registration.showNotification(title, options)
    );
  } catch (err) {
    console.error('>>> [SW] Error processing push event:', err);
    
    // Fallback if JSON parsing fails
    const text = event.data.text();
    event.waitUntil(
      self.registration.showNotification('SchoolGo Alert', {
        body: text
      })
    );
  }
});

self.addEventListener('notificationclick', (event) => {
  console.log('>>> [SW] Notification clicked');
  event.notification.close();
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) return client.focus();
      }
      if (clients.openWindow) return clients.openWindow('/');
    })
  );
});
