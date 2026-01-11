// Professional Service Worker for SweatSmart App
// Handles persistent notifications even when app is closed
// Version control for cache busting
const CACHE_VERSION = 'v2.1.0';
const CACHE_NAME = `sweatsmart-${CACHE_VERSION}`;

// Testing mode: 10-minute intervals
const TESTING_MODE = true;
const TEST_INTERVAL_MS = 10 * 60 * 1000; // 10 minutes
const CHECK_INTERVAL_MS = 30000; // Check every 30 seconds

let reminderCheckInterval = null;

self.addEventListener('install', (event) => {
  console.log('📱 SweatSmart Service Worker installed - version:', CACHE_VERSION);
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

// Background log reminder checker
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
    // Try to get next log time from IndexedDB or localStorage via client
    const clients = await self.clients.matchAll({ type: 'window' });
    
    if (clients.length === 0) {
      // App is closed - use cached value or estimate
      console.log('📅 SW: App closed, checking cached log time');
      
      // Try to read from cache
      const cache = await caches.open(CACHE_NAME);
      const cachedResponse = await cache.match('log-reminder-data');
      
      if (cachedResponse) {
        const data = await cachedResponse.json();
        const now = Date.now();
        
        if (data.nextLogTime && now >= data.nextLogTime) {
          console.log('📅 SW: Log reminder due! Showing notification...');
          await showLogReminderNotification();
          
          // Update next log time
          const nextTime = now + (TESTING_MODE ? TEST_INTERVAL_MS : 4 * 60 * 60 * 1000);
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
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    tag: 'log-reminder',
    requireInteraction: true,
    vibrate: [400, 100, 400, 100, 400],
    data: {
      url: '/climate',
      timestamp: Date.now()
    },
    actions: [
      { action: 'log', title: 'Log Now' },
      { action: 'later', title: 'Later' }
    ]
  };

  try {
    await self.registration.showNotification(title, options);
    console.log('📅 SW: Log reminder notification shown');
  } catch (error) {
    console.error('📅 SW: Failed to show notification:', error);
  }
}

// Listen for messages from the main app
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
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      tag: 'test-alert',
      vibrate: [200, 100, 200]
    });
  }
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  console.log('📱 Notification clicked:', event.notification.tag, 'action:', event.action);
  
  event.notification.close();
  
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

// Handle notification close
self.addEventListener('notificationclose', (event) => {
  console.log('📱 Notification closed:', event.notification.tag);
});

// Handle background sync for notifications
self.addEventListener('sync', (event) => {
  console.log('📱 Background sync:', event.tag);
  
  if (event.tag === 'sweatsmart-log-reminder') {
    event.waitUntil(checkForDueLog());
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
        url: data.url || '/',
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

console.log('📱 SweatSmart Professional Service Worker loaded - version:', CACHE_VERSION);
