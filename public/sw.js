// Professional Service Worker for SweatSmart App
// Handles persistent notifications even when app is closed

self.addEventListener('install', (event) => {
  console.log('📱 SweatSmart Service Worker installed');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('📱 SweatSmart Service Worker activated');
  event.waitUntil(self.clients.claim());
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  console.log('📱 Notification clicked:', event.notification.tag);
  
  event.notification.close();
  
  // Handle different actions
  if (event.action === 'view') {
    event.waitUntil(
      self.clients.openWindow('/')
    );
  } else if (event.action === 'dismiss') {
    // Just close the notification
    return;
  } else {
    // Default click - open the app
    event.waitUntil(
      self.clients.matchAll({ type: 'window' }).then((clientList) => {
        // If app is already open, focus it
        for (const client of clientList) {
          if (client.url === '/' && 'focus' in client) {
            return client.focus();
          }
        }
        // Otherwise open new window
        if (self.clients.openWindow) {
          return self.clients.openWindow('/');
        }
      })
    );
  }
});

// Handle notification close
self.addEventListener('notificationclose', (event) => {
  console.log('📱 Notification closed:', event.notification.tag);
});

// Handle background sync for notifications
self.addEventListener('sync', (event) => {
  console.log('📱 Background sync:', event.tag);
  
  if (event.tag === 'sweatsmart-notifications') {
    event.waitUntil(
      // Process any pending notifications
      self.registration.showNotification('SweatSmart Background Sync', {
        body: 'Processing pending notifications...',
        icon: '/favicon.ico',
        badge: '/favicon.ico'
      })
    );
  }
});

// Handle push notifications (for future integration)
self.addEventListener('push', (event) => {
  console.log('📱 Push notification received');
  
  if (event.data) {
    const data = event.data.json();
    
    const options = {
      body: data.body,
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      tag: 'sweatsmart-push',
      requireInteraction: data.type === 'critical',
      vibrate: data.type === 'critical' ? [800, 200, 800, 200, 800] : [400, 100, 400],
      data: {
        url: '/',
        timestamp: new Date().toISOString()
      },
      actions: data.type === 'critical' ? [
        { action: 'view', title: 'View Alert' },
        { action: 'dismiss', title: 'Dismiss' }
      ] : undefined
    };

    event.waitUntil(
      self.registration.showNotification(data.title, options)
    );
  }
});

console.log('📱 SweatSmart Professional Service Worker loaded');
