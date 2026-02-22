// Professional Service Worker for SweatSmart App
// Handles persistent notifications even when app is closed
// Version control for cache busting
const CACHE_VERSION = 'v2.4.0';
const CACHE_NAME = `sweatsmart-${CACHE_VERSION}`;

const OFFLINE_FALLBACK_URL = '/offline.html';

// PRODUCTION MODE
const TESTING_MODE = false;
const TEST_INTERVAL_MS = 10 * 60 * 1000;
const PRODUCTION_INTERVAL_MS = 4 * 60 * 60 * 1000;
const CHECK_INTERVAL_MS = 30000;

let reminderCheckInterval = null;

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
  startLogReminderChecker();
});

// ============= BACKGROUND LOG REMINDER CHECKER =============
function startLogReminderChecker() {
  if (reminderCheckInterval) clearInterval(reminderCheckInterval);
  console.log('📅 SW: Starting background log reminder checker');
  checkForDueLog();
  reminderCheckInterval = setInterval(() => { checkForDueLog(); }, CHECK_INTERVAL_MS);
}

async function checkForDueLog() {
  try {
    const clients = await self.clients.matchAll({ type: 'window' });
    if (clients.length === 0) {
      const cache = await caches.open(CACHE_NAME);
      const cachedResponse = await cache.match('log-reminder-data');
      if (cachedResponse) {
        const data = await cachedResponse.json();
        const now = Date.now();
        if (data.nextLogTime && now >= data.nextLogTime) {
          await showLogReminderNotification();
          await setAppBadge(1);
          const interval = TESTING_MODE ? TEST_INTERVAL_MS : PRODUCTION_INTERVAL_MS;
          await cache.put('log-reminder-data', new Response(JSON.stringify({
            nextLogTime: now + interval,
            lastAlertTime: now
          })));
        }
      }
    }
  } catch (error) {
    console.error('📅 SW: Error checking for due log:', error);
  }
}

async function showLogReminderNotification() {
  const title = '⏰ Time to Log Your Episode';
  const options = {
    body: 'Please record your sweat level. Tap to open Climate Alerts.',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    tag: 'log-reminder',
    requireInteraction: true,
    vibrate: [400, 100, 400, 100, 400],
    silent: false,
    data: { url: '/climate', timestamp: Date.now(), type: 'log-reminder' },
    actions: [
      { action: 'log', title: '📝 Log Now' },
      { action: 'later', title: '⏰ Later' }
    ]
  };
  try {
    await self.registration.showNotification(title, options);
    await notifyClientsToPlaySound();
  } catch (error) {
    console.error('📅 SW: Failed to show notification:', error);
  }
}

// ============= SOUND =============
// Service workers cannot play audio directly.
// This sends a message to any open app tab to play the sound.
// In your main app, listen for this message and play a sound when received.
async function notifyClientsToPlaySound() {
  try {
    const clients = await self.clients.matchAll({ type: 'window' });
    for (const client of clients) {
      client.postMessage({ type: 'PLAY_NOTIFICATION_SOUND' });
    }
  } catch (e) {
    console.warn('SW: Could not notify clients to play sound:', e);
  }
}

// ============= BADGING API =============
async function setAppBadge(count) {
  try {
    if ('setAppBadge' in navigator) await navigator.setAppBadge(count);
  } catch (error) {
    console.log('🔴 SW: Badging not supported:', error);
  }
}

async function clearAppBadge() {
  try {
    if ('clearAppBadge' in navigator) await navigator.clearAppBadge();
    else if ('setAppBadge' in navigator) await navigator.setAppBadge(0);
  } catch (error) {
    console.log('🔴 SW: Badging not supported:', error);
  }
}

// ============= MESSAGE HANDLER =============
self.addEventListener('message', async (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') self.skipWaiting();
  if (event.data && event.data.type === 'GET_VERSION') event.ports[0].postMessage({ version: CACHE_VERSION });

  if (event.data && event.data.type === 'SYNC_LOG_REMINDER') {
    const { nextLogTime } = event.data;
    const cache = await caches.open(CACHE_NAME);
    await cache.put('log-reminder-data', new Response(JSON.stringify({ nextLogTime, lastAlertTime: 0 })));
  }

  if (event.data && event.data.type === 'TEST_NOTIFICATION') {
    await self.registration.showNotification('✅ Test Alert', {
      body: 'Your alerts are working correctly! 🎉',
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      tag: 'test-alert',
      vibrate: [200, 100, 200],
      silent: false
    });
    await notifyClientsToPlaySound();
  }

  if (event.data && event.data.type === 'SET_BADGE') await setAppBadge(event.data.count || 1);
  if (event.data && event.data.type === 'CLEAR_BADGE') await clearAppBadge();

  if (event.data && event.data.type === 'SHOW_NOTIFICATION') {
    const { title, options } = event.data;
    await self.registration.showNotification(title, {
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      silent: false,
      ...options
    });
    await notifyClientsToPlaySound();
  }
});

// ============= NOTIFICATION CLICK HANDLER =============
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  clearAppBadge();
  const urlToOpen = event.notification.data?.url || '/climate';

  if (event.action === 'log' || event.action === 'view' || !event.action) {
    event.waitUntil(
      self.clients.matchAll({ type: 'window' }).then((clientList) => {
        for (const client of clientList) {
          if ('focus' in client) {
            client.focus();
            client.postMessage({ type: 'NAVIGATE', url: urlToOpen });
            return;
          }
        }
        if (self.clients.openWindow) return self.clients.openWindow(urlToOpen);
      })
    );
  }
});

// ============= NOTIFICATION CLOSE HANDLER =============
self.addEventListener('notificationclose', (event) => {
  console.log('📱 Notification closed:', event.notification.tag);
});

// ============= BACKGROUND SYNC =============
self.addEventListener('sync', (event) => {
  if (event.tag === 'sweatsmart-log-reminder') event.waitUntil(checkForDueLog());
  if (event.tag === 'sweatsmart-sync-data') event.waitUntil(syncLocalData());
});

async function syncLocalData() {
  console.log('📱 SW: Syncing local data...');
}

// ============= PERIODIC BACKGROUND SYNC =============
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'sweatsmart-log-check') event.waitUntil(checkForDueLog());
  if (event.tag === 'sweatsmart-weather-update') event.waitUntil(updateWeatherData());
});

async function updateWeatherData() {
  console.log('📱 SW: Updating weather data in background...');
}

// ============= PUSH NOTIFICATIONS (WORKS WHEN APP IS CLOSED) =============
self.addEventListener('push', (event) => {
  console.log('📱 [SW] Push event received! Has data:', !!event.data);

  event.waitUntil(
    (async () => {
      try {
        let data = {};
        if (event.data) {
          try {
            data = event.data.json();
          } catch (e) {
            data = { title: 'SweatSmart', body: event.data.text() };
          }
        }

        const title = data.title || 'SweatSmart';
        const tag = data.tag || 'sweatsmart-push';
        const type = data.type || 'general';
        const url = data.url || '/dashboard';

        const isClimate = tag === 'climate-alert' || ['extreme','moderate','high','low'].includes(type);
        const isReminder = tag === 'logging-reminder' || type === 'reminder';

        const options = {
          body: data.body || '',
          icon: '/icon-192.png',
          badge: '/icon-192.png',
          tag: tag,
          requireInteraction: isClimate || isReminder,
          vibrate: isClimate ? [800, 200, 800, 200, 800] : [400, 100, 400],
          silent: false,
          renotify: true,
          data: { url, timestamp: Date.now(), type },
          actions: isClimate ? [
            { action: 'view', title: '👁️ View Alert' },
            { action: 'dismiss', title: '❌ Dismiss' }
          ] : isReminder ? [
            { action: 'log', title: '📝 Log Now' },
            { action: 'later', title: '⏰ Later' }
          ] : [
            { action: 'open', title: '📱 Open' }
          ]
        };

        await self.registration.showNotification(title, options);
        console.log('📱 [SW] Notification shown:', title);

        // Tell any open app windows to play sound
        await notifyClientsToPlaySound();

      } catch (error) {
        console.error('📱 [SW] Push error:', error);
        await self.registration.showNotification('SweatSmart', {
          body: 'New alert available',
          icon: '/icon-192.png',
          badge: '/icon-192.png',
          tag: 'sweatsmart-fallback',
          data: { url: '/dashboard' }
        });
      }
    })()
  );
});

// ============= PUSH SUBSCRIPTION CHANGE =============
self.addEventListener('pushsubscriptionchange', (event) => {
  event.waitUntil(
    (async () => {
      try {
        const clients = await self.clients.matchAll({ type: 'window' });
        for (const client of clients) {
          client.postMessage({ type: 'PUSH_SUBSCRIPTION_CHANGED' });
        }
      } catch (error) {
        console.error('📱 [SW] Error handling subscription change:', error);
      }
    })()
  );
});

// ============= FETCH HANDLER =============
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  if (url.pathname.startsWith('/share-target/') && event.request.method === 'POST') {
    event.respondWith(handleShareTarget(event.request));
    return;
  }

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

async function handleShareTarget(request) {
  const formData = await request.formData();
  const title = formData.get('title') || '';
  const text = formData.get('text') || '';
  return Response.redirect(`/log?shared_title=${encodeURIComponent(title)}&shared_text=${encodeURIComponent(text)}`, 303);
}

console.log('📱 SweatSmart Professional Service Worker loaded - version:', CACHE_VERSION);
