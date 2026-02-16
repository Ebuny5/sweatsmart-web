import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const MIN_CRON_SECRET_LENGTH = 32;

// ── Crypto helpers ──

function base64UrlToBytes(base64url: string): Uint8Array {
  const base64 = base64url.replace(/-/g, '+').replace(/_/g, '/');
  const padded = base64 + '='.repeat((4 - base64.length % 4) % 4);
  const binary = atob(padded);
  return Uint8Array.from(binary, c => c.charCodeAt(0));
}

function bytesToBase64Url(bytes: Uint8Array): string {
  const binary = String.fromCharCode(...bytes);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

async function generateVapidSignature(
  endpoint: string,
  vapidPublicKey: string,
  vapidPrivateKey: string,
  vapidSubject: string
): Promise<{ authorization: string; cryptoKey: string }> {
  const endpointUrl = new URL(endpoint);
  const audience = `${endpointUrl.protocol}//${endpointUrl.host}`;

  const header = { typ: "JWT", alg: "ES256" };
  const now = Math.floor(Date.now() / 1000);
  const payload = { aud: audience, exp: now + 12 * 60 * 60, sub: vapidSubject };

  const base64UrlEncodeJson = (obj: object): string => {
    return bytesToBase64Url(new TextEncoder().encode(JSON.stringify(obj)));
  };

  const normalizeUncompressedPoint = (bytes: Uint8Array): Uint8Array => {
    if (bytes.length === 64) {
      const full = new Uint8Array(65);
      full[0] = 0x04;
      full.set(bytes, 1);
      return full;
    }
    return bytes;
  };

  const decodeAndValidatePublicKey = (publicKeyB64Url: string): Uint8Array => {
    const pk = normalizeUncompressedPoint(base64UrlToBytes(publicKeyB64Url));
    if (pk.length !== 65 || pk[0] !== 0x04) {
      throw new Error('Invalid VAPID public key format');
    }
    return pk;
  };

  const privateKeyBytes = base64UrlToBytes(vapidPrivateKey);
  let signingKey: CryptoKey;
  let publicKeyBytes: Uint8Array;

  if (privateKeyBytes.length === 32) {
    if (!vapidPublicKey) throw new Error('VAPID_PUBLIC_KEY required for 32-byte raw key');
    publicKeyBytes = decodeAndValidatePublicKey(vapidPublicKey);
    const x = publicKeyBytes.slice(1, 33);
    const y = publicKeyBytes.slice(33, 65);
    const jwk = { kty: 'EC', crv: 'P-256', x: bytesToBase64Url(x), y: bytesToBase64Url(y), d: bytesToBase64Url(privateKeyBytes) };
    signingKey = await crypto.subtle.importKey('jwk', jwk, { name: 'ECDSA', namedCurve: 'P-256' }, false, ['sign']);
  } else {
    signingKey = await crypto.subtle.importKey('pkcs8', privateKeyBytes.buffer, { name: 'ECDSA', namedCurve: 'P-256' }, true, ['sign']);
    const jwk = await crypto.subtle.exportKey('jwk', signingKey);
    if (!jwk.x || !jwk.y) throw new Error('PKCS8 key missing public coords');
    const x = base64UrlToBytes(jwk.x);
    const y = base64UrlToBytes(jwk.y);
    publicKeyBytes = new Uint8Array(65);
    publicKeyBytes[0] = 0x04;
    publicKeyBytes.set(x, 1);
    publicKeyBytes.set(y, 33);
  }

  const normalizedVapidPublicKey = bytesToBase64Url(publicKeyBytes);
  const unsignedToken = `${base64UrlEncodeJson(header)}.${base64UrlEncodeJson(payload)}`;
  const signatureBuffer = await crypto.subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, signingKey, new TextEncoder().encode(unsignedToken));
  const jwt = `${unsignedToken}.${bytesToBase64Url(new Uint8Array(signatureBuffer))}`;

  return { authorization: `vapid t=${jwt}, k=${normalizedVapidPublicKey}`, cryptoKey: normalizedVapidPublicKey };
}

async function sendPushNotification(
  subscription: { endpoint: string; p256dh: string; auth: string },
  payload: object,
  vapidPublicKey: string,
  vapidPrivateKey: string,
  vapidSubject: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { authorization, cryptoKey } = await generateVapidSignature(
      subscription.endpoint, vapidPublicKey, vapidPrivateKey, vapidSubject
    );

    const response = await fetch(subscription.endpoint, {
      method: 'POST',
      headers: {
        'Authorization': authorization,
        'Crypto-Key': `p256ecdsa=${cryptoKey}`,
        'Content-Type': 'application/json',
        'TTL': '86400',
        'Urgency': 'high',
      },
      body: JSON.stringify(payload),
    });

    if (response.ok || response.status === 201) return { success: true };
    if (response.status === 410 || response.status === 404) return { success: false, error: 'subscription_expired' };
    const errorText = await response.text();
    console.error(`Push failed: ${response.status} - ${errorText}`);
    return { success: false, error: `${response.status}: ${errorText}` };
  } catch (error) {
    console.error('Push notification error:', error);
    return { success: false, error: error.message };
  }
}

// ── Rate limit helpers ──

async function getNotificationCountToday(
  supabase: any,
  subscriptionId: string,
  notificationType: string
): Promise<number> {
  const today = new Date().toISOString().split('T')[0];
  const { count } = await supabase
    .from('notification_log')
    .select('*', { count: 'exact', head: true })
    .eq('subscription_id', subscriptionId)
    .eq('notification_type', notificationType)
    .eq('created_date', today);
  return count || 0;
}

async function logNotification(
  supabase: any,
  subscriptionId: string,
  userId: string | null,
  notificationType: string
) {
  await supabase.from('notification_log').insert({
    subscription_id: subscriptionId,
    user_id: userId,
    notification_type: notificationType,
    created_date: new Date().toISOString().split('T')[0],
  });
}

// ── Risk calculation ──

function calculateSweatRisk(temp: number, humidity: number, uv: number) {
  const tempF = (temp * 9 / 5) + 32;
  let heatIndexC = temp;
  if (tempF >= 80) {
    const hiF = -42.379 + 2.04901523 * tempF + 10.14333127 * humidity
      - 0.22475541 * tempF * humidity - 0.00683783 * tempF * tempF
      - 0.05481717 * humidity * humidity + 0.00122874 * tempF * tempF * humidity
      + 0.00085282 * tempF * humidity * humidity - 0.00000199 * tempF * tempF * humidity * humidity;
    heatIndexC = (hiF - 32) * 5 / 9;
  }
  const effectiveTemp = Math.max(temp, heatIndexC);

  if (effectiveTemp >= 35 || (effectiveTemp >= 32 && humidity >= 70) || uv > 10) {
    return 'extreme';
  }
  if (effectiveTemp >= 28 && humidity >= 70) {
    return 'moderate';
  }
  return 'normal'; // No push for normal
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const vapidPublicKey = Deno.env.get('VAPID_PUBLIC_KEY') ?? '';
    const vapidPrivateKey = Deno.env.get('VAPID_PRIVATE_KEY')!;
    const vapidSubject = Deno.env.get('VAPID_SUBJECT')!;
    const cronSecret = Deno.env.get('CRON_SECRET');

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { action, userId, endpoint, notification } = await req.json();

    // ── Public: Return VAPID public key ──
    if (action === 'get_vapid_public_key') {
      const { cryptoKey } = await generateVapidSignature('https://example.com', vapidPublicKey, vapidPrivateKey, vapidSubject);
      return new Response(JSON.stringify({ success: true, publicKey: cryptoKey }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ── Auth: cron vs JWT ──
    const isCronAction = action === 'send_climate_alerts' || action === 'send_logging_reminders';
    if (isCronAction) {
      const cronHeader = req.headers.get('x-cron-secret');
      if (!cronSecret || cronSecret.length < MIN_CRON_SECRET_LENGTH) {
        console.error('CRON_SECRET too short:', cronSecret?.length || 0);
        return new Response(JSON.stringify({ error: 'Server config error' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
      if (!cronHeader || cronHeader !== cronSecret) {
        console.error('Cron auth failed. Header present:', !!cronHeader);
        return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
    } else {
      const authHeader = req.headers.get('authorization');
      if (!authHeader?.startsWith('Bearer ')) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
      const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, { global: { headers: { Authorization: authHeader } } });
      const token = authHeader.replace('Bearer ', '');
      const { data: claimsData, error: claimsError } = await supabaseAuth.auth.getClaims(token);
      if (claimsError || !claimsData?.claims?.sub) {
        return new Response(JSON.stringify({ error: 'Invalid token' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
      const authenticatedUserId = claimsData.claims.sub as string;
      if (action === 'send_to_user' && userId && userId !== authenticatedUserId) {
        return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
      if (action === 'send_to_endpoint' && endpoint) {
        const { data: sc } = await supabase.from('push_subscriptions').select('user_id').eq('endpoint', endpoint).single();
        if (sc && sc.user_id !== authenticatedUserId) {
          return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }
      }
    }

    // ── send_to_user ──
    if (action === 'send_to_user' && userId) {
      const { data: subscriptions } = await supabase.from('push_subscriptions').select('*').eq('user_id', userId).eq('is_active', true);
      const results = await Promise.all(
        (subscriptions || []).map(async (sub: any) => {
          const result = await sendPushNotification({ endpoint: sub.endpoint, p256dh: sub.p256dh, auth: sub.auth }, notification, vapidPublicKey, vapidPrivateKey, vapidSubject);
          if (!result.success && result.error === 'subscription_expired') await supabase.from('push_subscriptions').delete().eq('id', sub.id);
          return result;
        })
      );
      return new Response(JSON.stringify({ success: true, results }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // ── send_to_endpoint ──
    if (action === 'send_to_endpoint' && endpoint) {
      const { data: subscription } = await supabase.from('push_subscriptions').select('*').eq('endpoint', endpoint).eq('is_active', true).single();
      if (!subscription) throw new Error('Subscription not found');
      const result = await sendPushNotification({ endpoint: subscription.endpoint, p256dh: subscription.p256dh, auth: subscription.auth }, notification, vapidPublicKey, vapidPrivateKey, vapidSubject);
      return new Response(JSON.stringify({ success: result.success, error: result.error }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // ══════════════════════════════════════════════════════
    // ── LOGGING REMINDERS (every 4 hours, max 6/day) ──
    // ══════════════════════════════════════════════════════
    if (action === 'send_logging_reminders') {
      const { data: subscriptions } = await supabase.from('push_subscriptions').select('*').eq('is_active', true);
      const FOUR_HOURS_MS = 4 * 60 * 60 * 1000;
      const now = Date.now();
      let sent = 0, skipped = 0, failed = 0;

      for (const sub of subscriptions || []) {
        try {
          // Rate limit: max 6 logging reminders per day
          const todayCount = await getNotificationCountToday(supabase, sub.id, 'logging_reminder');
          if (todayCount >= 6) { skipped++; continue; }

          // Check last reminder sent
          if (sub.last_reminder_sent_at) {
            const lastSent = new Date(sub.last_reminder_sent_at).getTime();
            if (now - lastSent < FOUR_HOURS_MS) { skipped++; continue; }
          }

          // For authenticated users, check last episode log time (reset timer on log)
          if (sub.user_id) {
            const { data: lastEpisode } = await supabase
              .from('episodes')
              .select('created_at')
              .eq('user_id', sub.user_id)
              .order('created_at', { ascending: false })
              .limit(1)
              .single();

            if (lastEpisode) {
              const lastLogTime = new Date(lastEpisode.created_at).getTime();
              if (now - lastLogTime < FOUR_HOURS_MS) { skipped++; continue; }
            }
          }

          const result = await sendPushNotification(
            { endpoint: sub.endpoint, p256dh: sub.p256dh, auth: sub.auth },
            {
              title: 'Time to Log Your Episode',
              body: 'Record your sweat level for the last 4 hours for accurate tracking.',
              tag: 'logging-reminder',
              type: 'reminder',
              url: '/log-episode',
            },
            vapidPublicKey, vapidPrivateKey, vapidSubject
          );

          if (result.success) {
            sent++;
            await logNotification(supabase, sub.id, sub.user_id, 'logging_reminder');
            await supabase.from('push_subscriptions').update({ last_reminder_sent_at: new Date().toISOString() }).eq('id', sub.id);
          } else {
            failed++;
            if (result.error === 'subscription_expired') await supabase.from('push_subscriptions').delete().eq('id', sub.id);
          }
        } catch (err) {
          console.error('Reminder error for sub:', sub.id, err);
          failed++;
        }
      }

      console.log(`Logging reminders: sent=${sent}, skipped=${skipped}, failed=${failed}`);
      return new Response(JSON.stringify({ success: true, sent, skipped, failed, total: subscriptions?.length || 0 }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ══════════════════════════════════════════════════════════
    // ── CLIMATE ALERTS (server-side weather, max 3+3/day) ──
    // ══════════════════════════════════════════════════════════
    if (action === 'send_climate_alerts') {
      const { data: subscriptions } = await supabase.from('push_subscriptions').select('*').eq('is_active', true);
      const weatherApiKey = Deno.env.get('OPENWEATHER_API_KEY');
      if (!weatherApiKey) {
        return new Response(JSON.stringify({ error: 'OPENWEATHER_API_KEY not set' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      let sent = 0, skipped = 0, failed = 0;

      for (const sub of subscriptions || []) {
        if (!sub.latitude || !sub.longitude) { skipped++; continue; }

        try {
          // Random jitter 0-30s to avoid thundering herd
          const jitter = Math.random() * 30000;
          await new Promise(r => setTimeout(r, jitter));

          // Fetch weather
          const weatherRes = await fetch(
            `https://api.openweathermap.org/data/2.5/weather?lat=${sub.latitude}&lon=${sub.longitude}&units=metric&appid=${weatherApiKey}`
          );
          const weather = await weatherRes.json();
          const temp = weather.main?.temp || 0;
          const humidity = weather.main?.humidity || 0;

          // UV index
          let uv = 0;
          try {
            const uvRes = await fetch(
              `https://api.openweathermap.org/data/2.5/uvi?lat=${sub.latitude}&lon=${sub.longitude}&appid=${weatherApiKey}`
            );
            const uvData = await uvRes.json();
            uv = uvData.value || 0;
          } catch { /* UV fetch optional */ }

          // Check user thresholds
          const userTempThreshold = sub.temperature_threshold || 28;
          const userHumidityThreshold = sub.humidity_threshold || 70;
          const userUvThreshold = sub.uv_threshold || 10;

          const risk = calculateSweatRisk(temp, humidity, uv);

          // Only push for moderate or extreme
          if (risk === 'normal') { skipped++; continue; }

          // Check if user thresholds are exceeded
          const thresholdsExceeded = temp >= userTempThreshold || humidity >= userHumidityThreshold || uv >= userUvThreshold;
          if (!thresholdsExceeded && risk === 'moderate') { skipped++; continue; }

          // Rate limit: max 3 moderate + 3 extreme per day (total cap 6)
          const notifType = risk === 'extreme' ? 'climate_extreme' : 'climate_moderate';
          const todayCount = await getNotificationCountToday(supabase, sub.id, notifType);
          if (todayCount >= 3) { skipped++; continue; }

          // Also check total climate alerts today
          const totalModerate = await getNotificationCountToday(supabase, sub.id, 'climate_moderate');
          const totalExtreme = await getNotificationCountToday(supabase, sub.id, 'climate_extreme');
          if (totalModerate + totalExtreme >= 6) { skipped++; continue; }

          // Build specific message
          let title: string;
          let body: string;
          if (risk === 'extreme') {
            title = 'SweatSmart Climate Alert: Extreme Risk';
            body = `High heat (${temp.toFixed(0)}°C) & humidity (${humidity}%) — stay indoors with AC! UV: ${uv.toFixed(0)}`;
          } else {
            title = 'SweatSmart Climate Alert: Moderate Risk';
            body = `Temp ${temp.toFixed(0)}°C, humidity ${humidity}% — prepare cooling aids and stay hydrated.`;
          }

          const result = await sendPushNotification(
            { endpoint: sub.endpoint, p256dh: sub.p256dh, auth: sub.auth },
            { title, body, tag: 'climate-alert', type: risk, url: '/climate' },
            vapidPublicKey, vapidPrivateKey, vapidSubject
          );

          if (result.success) {
            sent++;
            await logNotification(supabase, sub.id, sub.user_id, notifType);
          } else {
            failed++;
            if (result.error === 'subscription_expired') await supabase.from('push_subscriptions').delete().eq('id', sub.id);
          }
        } catch (err) {
          console.error('Climate alert error for sub:', sub.id, err);
          failed++;
        }
      }

      console.log(`Climate alerts: sent=${sent}, skipped=${skipped}, failed=${failed}`);
      return new Response(JSON.stringify({ success: true, sent, skipped, failed, total: subscriptions?.length || 0 }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Invalid action' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (error) {
    console.error('Edge function error:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
