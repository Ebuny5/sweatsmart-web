// Professional Service Worker for SweatSmart App
// Handles persistent notifications even when app is closed
// Version control for cache busting
const CACHE_VERSION = 'v2.3.0';
const CACHE_NAME = `sweatsmart-${CACHE_VERSION}`;

// Offline fallback (kept from the previous PWA Builder SW so we don't regress offline UX)
const OFFLINE_FALLBACK_URL = '/offline.html';

// Testing mode: 10-minute intervals (set to false for production 4-hour intervals)
const TESTING_MODE = true;
const TEST_INTERVAL_MS = 10 * 60 * 1000; // 10 minutes
const PRODUCTION_INTERVAL_MS = 4 * 60 * 60 * 1000; // 4 hours
const CHECK_INTERVAL_MS = 30000; // Check every 30 seconds


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
      // Delete old caches
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
      // Claim all clients immediately
      self.clients.claim()
    ])
  );
  
  // Start background log reminder checker
  startLogReminderChecker();
});

// ============= BACKGROUND LOG REMINDER CHECKER =============
function startLogReminderChecker() {
  if (reminderCheckInterval) {
    clearInterval(reminderCheckInterval);
  }
  
  console.log('📅 SW: Starting background log reminder checker');
  
  // Initial check
  checkForDueLog();
  
  // Check periodically
  reminderCheckInterval = setInterval(() => {
    checkForDueLog();
  }, CHECK_INTERVAL_MS);
}

async function checkForDueLog() {
  try {
    const clients = await self.clients.matchAll({ type: 'window' });
    
    if (clients.length === 0) {
      // App is closed - use cached value
      console.log('📅 SW: App closed, checking cached log time');
      
      const cache = await caches.open(CACHE_NAME);
      const cachedResponse = await cache.match('log-reminder-data');
      
      if (cachedResponse) {
        const data = await cachedResponse.json();
        const now = Date.now();
        
        if (data.nextLogTime && now >= data.nextLogTime) {
          console.log('📅 SW: Log reminder due! Showing notification...');
          await showLogReminderNotification();
          
          // Set app badge
          await setAppBadge(1);
          
          // Update next log time
          const interval = TESTING_MODE ? TEST_INTERVAL_MS : PRODUCTION_INTERVAL_MS;
          const nextTime = now + interval;
          await cache.put('log-reminder-data', new Response(JSON.stringify({
            nextLogTime: nextTime,
            lastAlertTime: now
          })));
        }
      }
    } else {
      // App is open - let the main app handle it
      console.log('📅 SW: App is open, delegating to main app');
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
    data: {
      url: '/climate',
      timestamp: Date.now(),
      type: 'log-reminder'
    },
    actions: [
      { action: 'log', title: '📝 Log Now' },
      { action: 'later', title: '⏰ Later' }
    ]
  };

  try {
    await self.registration.showNotification(title, options);
    console.log('📅 SW: Log reminder notification shown');
  } catch (error) {
    console.error('📅 SW: Failed to show notification:', error);
  }
}

// ============= BADGING API =============
async function setAppBadge(count) {
  try {
    if ('setAppBadge' in navigator) {
      await navigator.setAppBadge(count);
      console.log('🔴 SW: App badge set to:', count);
    }
  } catch (error) {
    console.log('🔴 SW: Badging not supported:', error);
  }
}

async function clearAppBadge() {
  try {
    if ('clearAppBadge' in navigator) {
      await navigator.clearAppBadge();
      console.log('🔴 SW: App badge cleared');
    } else if ('setAppBadge' in navigator) {
      await navigator.setAppBadge(0);
    }
  } catch (error) {
    console.log('🔴 SW: Badging not supported:', error);
  }
}

// ============= MESSAGE HANDLER =============
self.addEventListener('message', async (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    console.log('📱 Skip waiting requested, activating new service worker');
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({ version: CACHE_VERSION });
  }
  
  // Sync log reminder data from main app
  if (event.data && event.data.type === 'SYNC_LOG_REMINDER') {
    const { nextLogTime } = event.data;
    console.log('📅 SW: Syncing log reminder data, next:', new Date(nextLogTime).toLocaleString());
    
    const cache = await caches.open(CACHE_NAME);
    await cache.put('log-reminder-data', new Response(JSON.stringify({
      nextLogTime,
      lastAlertTime: 0
    })));
  }
  
  // Test notification request
  if (event.data && event.data.type === 'TEST_NOTIFICATION') {
    console.log('📱 SW: Test notification requested');
    await self.registration.showNotification('✅ Test Alert', {
      body: 'Your alerts are working correctly! 🎉',
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      tag: 'test-alert',
      vibrate: [200, 100, 200]
    });
  }
  
  // Set badge from main app
  if (event.data && event.data.type === 'SET_BADGE') {
    await setAppBadge(event.data.count || 1);
  }
  
  // Clear badge from main app
  if (event.data && event.data.type === 'CLEAR_BADGE') {
    await clearAppBadge();
  }
  
  // Show notification from main app
  if (event.data && event.data.type === 'SHOW_NOTIFICATION') {
    const { title, options } = event.data;
    await self.registration.showNotification(title, {
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      ...options
    });
  }
});

// ============= NOTIFICATION CLICK HANDLER =============
self.addEventListener('notificationclick', (event) => {
  console.log('📱 Notification clicked:', event.notification.tag, 'action:', event.action);
  
  event.notification.close();
  
  // Clear badge when notification is clicked
  clearAppBadge();
  
  const urlToOpen = event.notification.data?.url || '/climate';
  
  if (event.action === 'log' || event.action === 'view' || !event.action) {
    // Open the app to the appropriate page
    event.waitUntil(
      self.clients.matchAll({ type: 'window' }).then((clientList) => {
        // If app is already open, focus and navigate
        for (const client of clientList) {
          if ('focus' in client) {
            client.focus();
            client.postMessage({ type: 'NAVIGATE', url: urlToOpen });
            return;
          }
        }
        // Otherwise open new window
        if (self.clients.openWindow) {
          return self.clients.openWindow(urlToOpen);
        }
      })
    );
  } else if (event.action === 'later' || event.action === 'dismiss') {
    // Just close - will remind again later
    console.log('📱 Notification dismissed/snoozed');
  }
});

// ============= NOTIFICATION CLOSE HANDLER =============
self.addEventListener('notificationclose', (event) => {
  console.log('📱 Notification closed:', event.notification.tag);
});

// ============= BACKGROUND SYNC =============
self.addEventListener('sync', (event) => {
  console.log('📱 Background sync:', event.tag);
  
  if (event.tag === 'sweatsmart-log-reminder') {
    event.waitUntil(checkForDueLog());
  }
  
  if (event.tag === 'sweatsmart-sync-data') {
    event.waitUntil(syncLocalData());
  }
});

async function syncLocalData() {
  console.log('📱 SW: Syncing local data...');
  // Future: sync offline episodes to server
}

// ============= PERIODIC BACKGROUND SYNC =============
self.addEventListener('periodicsync', (event) => {
  console.log('📱 Periodic sync:', event.tag);
  
  if (event.tag === 'sweatsmart-log-check') {
    event.waitUntil(checkForDueLog());
  }
  
  if (event.tag === 'sweatsmart-weather-update') {
    event.waitUntil(updateWeatherData());
  }
});

async function updateWeatherData() {
  console.log('📱 SW: Updating weather data in background...');
  // Future: fetch weather data and cache it
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
            console.log('📱 [SW] Push payload:', JSON.stringify(data));
          } catch (e) {
            const text = event.data.text();
            console.log('📱 [SW] Push text:', text);
            data = { title: 'SweatSmart', body: text };
          }
        }
        
        const title = data.title || 'SweatSmart';
        const tag = data.tag || 'sweatsmart-push';
        const type = data.type || 'general';
        const url = data.url || '/dashboard';
        
        const isClimate = tag === 'climate-alert' || type === 'extreme' || type === 'moderate';
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

// Handle push subscription change (e.g., when browser updates subscription)
self.addEventListener('pushsubscriptionchange', (event) => {
  console.log('📱 [SW] Push subscription changed, need to resubscribe');
  
  event.waitUntil(
    (async () => {
      try {
        // Notify any open clients about subscription change
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

// ============= FETCH HANDLER (for share target) =============
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Handle share target POST requests
  if (url.pathname.startsWith('/share-target/') && event.request.method === 'POST') {
    event.respondWith(handleShareTarget(event.request));
    return;
  }

  // Offline fallback for navigations
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
  
  // Redirect to log page with shared data
  const redirectUrl = `/log?shared_title=${encodeURIComponent(title)}&shared_text=${encodeURIComponent(text)}`;
  return Response.redirect(redirectUrl, 303);
}

console.log('📱 SweatSmart Professional Service Worker loaded - version:', CACHE_VERSION);
