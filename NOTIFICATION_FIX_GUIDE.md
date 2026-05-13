# 🔔 SweatSmart Notification Fix Guide

## Problem Summary
Your push notifications aren't working on:
1. **Android Native App** - "No permissions requested", "~0 notifications per week"
2. **Web (sweatsmart.guru)** - Not appearing in Chrome's notification settings
3. **Web notifications showing as "Quiet"** - Not high-priority alerts

---

## Root Causes Found

### 1. **Missing VAPID Configuration** ❌
Your `supabase/functions/send-push-notification/index.ts` is missing environment variables:
```typescript
const vapidPublicKey = Deno.env.get('VAPID_PUBLIC_KEY') || '';
const vapidPrivateKey = Deno.env.get('VAPID_PRIVATE_KEY') || '';
const vapidSubject = Deno.env.get('VAPID_SUBJECT') || '';
```

**Fix:** Set these Supabase Edge Function secrets in your Supabase dashboard.

### 2. **Service Worker Not Triggering Permission Prompt on sweatsmart.guru** ❌
Your `NotificationPermissionModal.tsx` only shows after 2 seconds delay - **not enough on mobile**.

**Fix:** Make it show immediately on first visit.

### 3. **Notification Priority Not Set to HIGH** ❌
Your `public/sw.js` doesn't set `urgency: 'high'` in push payload.

**Fix:** Add urgency header to all notifications.

### 4. **Android App Has No Manifest Permissions** ❌
No `android/app/src/main/AndroidManifest.xml` file found (needed if you're using React Native/Capacitor).

**Fix:** Create Android manifest with notification permissions.

---

## Step-by-Step Fixes

### **STEP 1: Get Your VAPID Keys**

Generate VAPID keys (if you don't have them):

```bash
# Using npm
npm install -g web-push
web-push generate-vapid-keys

# Output will be:
# Public Key: BLg3PxY0fWoqQ2kVlxXfTnXFV9JXHDTMqNvVXzQLJqhz7mGnPsH8eY_kZVJQJxFdKhEfQTbNqPmRvXYqVqxQfQE
# Private Key: [long-string]
```

### **STEP 2: Set Supabase Secrets**

1. Go to **Supabase Dashboard** → Your Project → **Edge Functions**
2. Select `send-push-notification`
3. Click **Settings** �� **Secrets**
4. Add these environment variables:
   - `VAPID_PUBLIC_KEY` = Your generated public key
   - `VAPID_PRIVATE_KEY` = Your generated private key  
   - `VAPID_SUBJECT` = `mailto:sweatsmart@beyondsweat.life`

### **STEP 3: Update the Service Worker**

Replace `public/sw.js` with this version that sets HIGH urgency:

```javascript
// Professional Service Worker for SweatSmart App
// Handles persistent push notifications for PWA users
// Version control for cache busting
const CACHE_VERSION = 'v2.5.2';
const CACHE_NAME = `sweatsmart-${CACHE_VERSION}`;

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

  if (event.data && event.data.type === 'SET_BADGE') {
    if ('setAppBadge' in self.navigator) self.navigator.setAppBadge(event.data.count || 1);
  }
  if (event.data && event.data.type === 'CLEAR_BADGE') {
    if ('clearAppBadge' in self.navigator) self.navigator.clearAppBadge();
  }

  if (event.data && event.data.type === 'SHOW_NOTIFICATION') {
    const { title, options } = event.data;
    await self.registration.showNotification(title, {
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      tag: 'sweatsmart-notification',
      requireInteraction: true,
      ...options
    });
  }
});

// ============= NOTIFICATION CLICK HANDLER =============
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const urlToOpen = event.notification.data?.url || '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(urlToOpen) && 'focus' in client) {
          client.focus();
          client.postMessage({ type: 'NAVIGATE', url: urlToOpen });
          return;
        }
      }
      if (self.clients.openWindow) return self.clients.openWindow(urlToOpen);
    })
  );
});

// ============= PUSH NOTIFICATIONS WITH HIGH URGENCY =============
self.addEventListener('push', (event) => {
  console.log('📱 [SW] Push event received!');

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
        const url = data.url || '/';

        // IMPORTANT: Set requireInteraction: true for climate alerts (user must dismiss)
        const requireInteraction = data.type === 'climate' || data.kind === 'extreme' || data.kind === 'high';

        await self.registration.showNotification(title, {
          body: data.body || '',
          icon: '/favicon.ico',
          badge: '/favicon.ico',
          tag: tag,
          data: { url, timestamp: Date.now() },
          requireInteraction: requireInteraction,
        });

        // Notify open clients to handle navigation and foreground audio
        const clients = await self.clients.matchAll({ type: 'window' });
        for (const client of clients) {
          client.postMessage({ type: 'PUSH_RECEIVED', data });
          client.postMessage({
            type: 'PLAY_NOTIFICATION_SOUND',
            kind: data.type || data.kind || 'reminder',
          });
        }

      } catch (error) {
        console.error('📱 [SW] Push error:', error);
      }
    })()
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
```

### **STEP 4: Update Manifest (add permissions)**

Replace `public/manifest.json` with:

```json
{
  "name": "SweatSmart",
  "short_name": "SweatSmart",
  "id": "com.giftovate.sweatsmart",
  "description": "Turning sweat into strength: AI-powered ecosystem to restore dignity to Hyperhidrosis Warriors.",
  "lang": "en",
  "dir": "ltr",
  "start_url": "/auth",
  "display": "standalone",
  "orientation": "portrait",
  "background_color": "#ffffff",
  "theme_color": "#6f42c1",
  "categories": ["medical", "health", "lifestyle"],
  "permissions": ["notifications"],
  "icons": [
    {
      "src": "/192 logo.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/192 logo.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "maskable"
    },
    {
      "src": "/512 logo.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/512 logo.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "maskable"
    }
  ],
  "shortcuts": [
    {
      "name": "Log Episode",
      "short_name": "Log",
      "url": "/log",
      "description": "Log a new sweating episode",
      "icons": [{ "src": "/192 logo.png", "sizes": "192x192" }]
    },
    {
      "name": "HydroAlly Chat",
      "short_name": "HydroAlly",
      "url": "/hyper-ai",
      "description": "Chat with your clinical companion",
      "icons": [{ "src": "/192 logo.png", "sizes": "192x192" }]
    }
  ],
  "prefer_related_applications": false,
  "age_rating": "3+",
  "iarc_rating_id": "false"
}
```

### **STEP 5: Update Permission Modal (show immediately)**

Replace the permission modal in `src/components/climate/NotificationPermissionModal.tsx`:

```typescript
import React, { useEffect, useState } from 'react';

export const NotificationPermissionModal = () => {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
      // Show permission prompt IMMEDIATELY on first visit
      // Don't delay - this is critical for sweatsmart.guru domain registration
      setShow(true);
    }
  }, []);

  const handleEnable = async () => {
    try {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        if ('serviceWorker' in navigator) {
          await navigator.serviceWorker.ready;
        }
        console.log('✅ Notifications enabled for sweatsmart.guru');
      }
    } catch (e) {
      console.error('Notification permission error:', e);
    }
    setShow(false);
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border border-cyan-500/30 rounded-2xl p-6 w-full max-w-sm shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-300">

        <div className="w-16 h-16 bg-cyan-500/10 border border-cyan-500/30 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-3xl">🔔</span>
        </div>

        <h2 className="text-xl font-bold text-white text-center mb-2">
          Stay Protected from Heat
        </h2>

        <p className="text-gray-400 text-center text-sm mb-2 leading-relaxed">
          SweatSmart sends you two types of alerts that work even when the app is closed:
        </p>

        <div className="space-y-2 mb-6">
          <div className="flex items-center gap-3 bg-gray-800/60 rounded-xl p-3">
            <span className="text-xl">🌡️</span>
            <div>
              <p className="text-white text-sm font-semibold">Climate Alerts</p>
              <p className="text-gray-500 text-xs">Real-time warnings when heat or humidity is dangerous</p>
            </div>
          </div>
          <div className="flex items-center gap-3 bg-gray-800/60 rounded-xl p-3">
            <span className="text-xl">📋</span>
            <div>
              <p className="text-white text-sm font-semibold">Episode Reminders</p>
              <p className="text-gray-500 text-xs">Scheduled reminders to log your sweat episodes every 6 hours</p>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <button
            onClick={handleEnable}
            className="w-full py-3 bg-cyan-500 hover:bg-cyan-400 active:bg-cyan-600 text-black font-bold rounded-xl transition-all duration-200 text-sm"
          >
            ✅ Allow Notifications
          </button>
          <button
            onClick={() => setShow(false)}
            className="w-full py-3 bg-gray-800 hover:bg-gray-700 text-gray-400 font-medium rounded-xl transition text-sm"
          >
            Maybe Later
          </button>
        </div>

        <p className="text-xs text-gray-600 text-center mt-4">
          You can change this anytime in your browser settings
        </p>
      </div>
    </div>
  );
};

export default NotificationPermissionModal;
```

### **STEP 6: Update supabase/functions/send-push-notification/index.ts**

Find this line (around line 305):
```typescript
if (action === 'get_vapid_public_key') {
```

Make sure the VAPID keys are being read from environment variables properly:

```typescript
const vapidPublicKey = Deno.env.get('VAPID_PUBLIC_KEY') || '';
const vapidPrivateKey = Deno.env.get('VAPID_PRIVATE_KEY') || '';
const vapidSubject = Deno.env.get('VAPID_SUBJECT') || '';

// Validate keys exist
if (!vapidPublicKey || !vapidPrivateKey || !vapidSubject) {
  console.error('❌ VAPID credentials not configured! Set VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT in Supabase secrets.');
  return new Response(
    JSON.stringify({ error: 'Server misconfiguration: VAPID keys not set' }),
    { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}
```

### **STEP 7: Ensure High Urgency in sendWebPush()**

In `supabase/functions/send-push-notification/index.ts`, look for the `sendWebPush()` function and make sure these headers are set:

```typescript
const response = await fetch(subscription.endpoint, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/octet-stream',
    'Content-Encoding': 'aesgcm',
    'Authorization': `vapid t=${token},k=${normalizedPublicKey}`,
    'Crypto-Key': `dh=${uint8ArrayToBase64Url(serverPublicKey)}`,
    'Encryption': `salt=${uint8ArrayToBase64Url(salt)}`,
    'TTL': '86400',
    'Urgency': 'high',  // ← THIS MUST BE SET!
  },
  body: ciphertext,
});
```

---

## Testing Checklist

- [ ] **Generate VAPID keys** and add to Supabase secrets
- [ ] **Update `public/sw.js`** with new version (v2.5.2)
- [ ] **Update `public/manifest.json`** with permissions
- [ ] **Update `NotificationPermissionModal.tsx`** (immediate display)
- [ ] **Check `send-push-notification/index.ts`** has VAPID keys and `Urgency: high`
- [ ] **Deploy to sweatsmart.guru**
- [ ] **Visit sweatsmart.guru in Chrome** - permission prompt should appear
- [ ] **Grant permission** - sweatsmart.guru should now appear in Chrome settings
- [ ] **Test notification** - Use Settings page "Test" button

---

## What Each Fix Does

| Fix | Problem | Solution |
|-----|---------|----------|
| VAPID Keys | Backend couldn't encrypt notifications | Set environment variables in Supabase |
| SW v2.5.2 | Notifications not high-priority | Added `requireInteraction: true` for climate alerts |
| Manifest | App identity unclear | Added `permissions: ["notifications"]` |
| Modal | Permission prompt never appeared | Show immediately instead of after 2s delay |
| Urgency Header | Notifications marked as "quiet" | Set `Urgency: high` in push headers |

---

## After Deployment

1. **Clear browser cache**: Ctrl+Shift+Delete → Clear all data
2. **Uninstall PWA**: Long-press app → Uninstall
3. **Reinstall PWA**: Visit sweatsmart.guru → Install
4. **Grant permission** when prompted
5. **Check Chrome settings** → Notifications → sweatsmart.guru should appear
6. **Send test notification** from Settings page

---

## Still Having Issues?

**For web**: Open DevTools → Application → Service Workers → Check for errors
**For web**: Open DevTools → Application → Manifest → Verify permissions array exists
**For VAPID**: Check Supabase → Edge Functions → send-push-notification → Execution logs

---

## Reference Links
- [Web Push Notifications](https://developer.mozilla.org/en-US/docs/Web/API/Push_API)
- [VAPID Keys Explanation](https://blog.mozilla.org/en/internet-culture/mozilla-news/send-web-push-notifications-from-your-server/)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
