self.addEventListener('push', (event) => {
  if (!event.data) return;

  try {
    const data = event.data.json();
    const title = data.notification.title || 'SchoolGo Alert';
    const options = {
      body: data.notification.body,
      icon: '/vite.svg',
      badge: '/vite.svg',
      data: data.notification.data || {}
    };

    event.waitUntil(self.registration.showNotification(title, options));
  } catch (err) {
    console.error('Error in push event:', err);
  }
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  // Example: Focus or open the app
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((clientList) => {
      for (const client of clientList) {
        if (client.url === '/' && 'focus' in client) return client.focus();
      }
      if (clients.openWindow) return clients.openWindow('/');
    })
  );
});
