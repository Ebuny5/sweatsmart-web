// Professional Service Worker for SweatSmart App
// Handles caching and basic PWA navigation.
// Notification logic is now handled natively by Capacitor.
const CACHE_VERSION = 'v2.5.1';
const CACHE_NAME = 'sweatsmart-' + CACHE_VERSION;

const OFFLINE_FALLBACK_URL = '/offline.html';

// ============= INSTALL & ACTIVATE =============
self.addEventListener('install', (event) => {
  console.log('📱 SweatSmart Service Worker installed - version:', CACHE_VERSION);
  event.waitUntil(
    (async () => {
      try {
        const cache = await caches.open(CACHE_NAME);
        await cache.addAll([OFFLINE_FALLBACK_URL]);
      } catch (e) {
        console.warn('📱 SW: Failed to cache offline fallback:', e);
      }
    })()
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('📱 SweatSmart Service Worker activated - version:', CACHE_VERSION);
  event.waitUntil(
    Promise.all([
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => name.startsWith('sweatsmart-') && name !== CACHE_NAME)
            .map((name) => {
              console.log('📱 Deleting old cache:', name);
              return caches.delete(name);
            })
        );
      }),
      self.clients.claim()
    ])
  );
});

// ============= MESSAGE HANDLER =============
self.addEventListener('message', async (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') self.skipWaiting();
  if (event.data && event.data.type === 'GET_VERSION') event.ports[0].postMessage({ version: CACHE_VERSION });
});

// ============= NOTIFICATION CLICK HANDLER (PWA FALLBACK) =============
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const urlToOpen = (event.notification && event.notification.data && event.notification.data.url) || '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.indexOf(urlToOpen) !== -1 && 'focus' in client) {
          client.focus();
          if (client.postMessage) {
            client.postMessage({ type: 'NAVIGATE', url: urlToOpen });
          }
          return;
        }
      }
      if (self.clients.openWindow) return self.clients.openWindow(urlToOpen);
    })
  );
});

// ============= FETCH HANDLER =============
self.addEventListener('fetch', (event) => {
  if (event.request.mode === 'navigate') {
    event.respondWith(
      (async () => {
        try {
          return await fetch(event.request);
        } catch (error) {
          const cache = await caches.open(CACHE_NAME);
          const cached = await cache.match(OFFLINE_FALLBACK_URL);
          return cached || new Response('Offline', { status: 503, statusText: 'Offline' });
        }
      })()
    );
  }
});

console.log('📱 SweatSmart Unified Service Worker loaded - version:', CACHE_VERSION);
