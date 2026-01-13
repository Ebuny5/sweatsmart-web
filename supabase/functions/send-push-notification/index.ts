import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Helper to convert base64url to Uint8Array
function base64UrlToBytes(base64url: string): Uint8Array {
  const base64 = base64url.replace(/-/g, '+').replace(/_/g, '/');
  const padded = base64 + '='.repeat((4 - base64.length % 4) % 4);
  const binary = atob(padded);
  return Uint8Array.from(binary, c => c.charCodeAt(0));
}

// Helper to convert Uint8Array to base64url
function bytesToBase64Url(bytes: Uint8Array): string {
  const binary = String.fromCharCode(...bytes);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

// Web Push VAPID implementation using JWK format
async function generateVapidSignature(
  endpoint: string,
  vapidPublicKey: string,
  vapidPrivateKey: string,
  vapidSubject: string
): Promise<{ authorization: string; cryptoKey: string }> {
  const endpointUrl = new URL(endpoint);
  const audience = `${endpointUrl.protocol}//${endpointUrl.host}`;
  
  // Create JWT header and payload
  const header = { typ: "JWT", alg: "ES256" };
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    aud: audience,
    exp: now + 12 * 60 * 60, // 12 hours
    sub: vapidSubject,
  };

  // Base64URL encode for JWT parts
  const base64UrlEncodeJson = (obj: object): string => {
    const json = JSON.stringify(obj);
    const bytes = new TextEncoder().encode(json);
    return bytesToBase64Url(bytes);
  };

  // Decode the private and public keys from base64url
  const privateKeyBytes = base64UrlToBytes(vapidPrivateKey);
  const publicKeyBytes = base64UrlToBytes(vapidPublicKey);

  // Build JWK for the ECDSA P-256 private key
  // Private key is 32 bytes (d), public key is 65 bytes (04 || x || y)
  const jwk = {
    kty: "EC",
    crv: "P-256",
    x: bytesToBase64Url(publicKeyBytes.slice(1, 33)),
    y: bytesToBase64Url(publicKeyBytes.slice(33, 65)),
    d: bytesToBase64Url(privateKeyBytes),
  };

  // Import the private key as JWK
  const cryptoKey = await crypto.subtle.importKey(
    "jwk",
    jwk,
    { name: "ECDSA", namedCurve: "P-256" },
    false,
    ["sign"]
  );

  // Create unsigned token
  const unsignedToken = `${base64UrlEncodeJson(header)}.${base64UrlEncodeJson(payload)}`;
  
  // Sign the token
  const signatureBuffer = await crypto.subtle.sign(
    { name: "ECDSA", hash: "SHA-256" },
    cryptoKey,
    new TextEncoder().encode(unsignedToken)
  );

  // Convert signature to base64url
  const signatureBase64Url = bytesToBase64Url(new Uint8Array(signatureBuffer));
  const jwt = `${unsignedToken}.${signatureBase64Url}`;

  return {
    authorization: `vapid t=${jwt}, k=${vapidPublicKey}`,
    cryptoKey: vapidPublicKey,
  };
}

// Encrypt payload using Web Push encryption
async function encryptPayload(
  payload: string,
  p256dh: string,
  auth: string
): Promise<{ encrypted: Uint8Array; salt: Uint8Array; serverPublicKey: Uint8Array }> {
  // Generate server key pair
  const serverKeyPair = await crypto.subtle.generateKey(
    { name: "ECDH", namedCurve: "P-256" },
    true,
    ["deriveBits"]
  );

  // Decode client public key
  const p256dhBase64 = p256dh.replace(/-/g, '+').replace(/_/g, '/');
  const paddedP256dh = p256dhBase64 + '='.repeat((4 - p256dhBase64.length % 4) % 4);
  const clientPublicKeyBytes = Uint8Array.from(atob(paddedP256dh), c => c.charCodeAt(0));

  // Import client public key
  const clientPublicKey = await crypto.subtle.importKey(
    "raw",
    clientPublicKeyBytes,
    { name: "ECDH", namedCurve: "P-256" },
    false,
    []
  );

  // Derive shared secret
  const sharedSecret = await crypto.subtle.deriveBits(
    { name: "ECDH", public: clientPublicKey },
    serverKeyPair.privateKey,
    256
  );

  // Decode auth secret
  const authBase64 = auth.replace(/-/g, '+').replace(/_/g, '/');
  const paddedAuth = authBase64 + '='.repeat((4 - authBase64.length % 4) % 4);
  const authSecret = Uint8Array.from(atob(paddedAuth), c => c.charCodeAt(0));

  // Generate salt
  const salt = crypto.getRandomValues(new Uint8Array(16));

  // Export server public key
  const serverPublicKeyBuffer = await crypto.subtle.exportKey("raw", serverKeyPair.publicKey);
  const serverPublicKey = new Uint8Array(serverPublicKeyBuffer);

  // Create info for HKDF
  const encoder = new TextEncoder();
  
  // PRK = HKDF-Extract(auth_secret, ecdh_secret)
  const prkKey = await crypto.subtle.importKey(
    "raw",
    authSecret,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const prk = new Uint8Array(await crypto.subtle.sign("HMAC", prkKey, new Uint8Array(sharedSecret)));

  // Create key info
  const keyInfoHeader = encoder.encode("Content-Encoding: aes128gcm\0");
  const keyInfo = new Uint8Array(keyInfoHeader.length);
  keyInfo.set(keyInfoHeader);

  // Derive content encryption key
  const cekKey = await crypto.subtle.importKey(
    "raw",
    prk,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const cekInfo = new Uint8Array([...encoder.encode("Content-Encoding: aes128gcm\0"), 1]);
  const cekHmac = await crypto.subtle.sign("HMAC", cekKey, cekInfo);
  const cek = new Uint8Array(cekHmac).slice(0, 16);

  // Derive nonce
  const nonceInfo = new Uint8Array([...encoder.encode("Content-Encoding: nonce\0"), 1]);
  const nonceHmac = await crypto.subtle.sign("HMAC", cekKey, nonceInfo);
  const nonce = new Uint8Array(nonceHmac).slice(0, 12);

  // Encrypt with AES-GCM
  const aesKey = await crypto.subtle.importKey(
    "raw",
    cek,
    { name: "AES-GCM" },
    false,
    ["encrypt"]
  );

  // Add padding delimiter
  const paddedPayload = new Uint8Array([...encoder.encode(payload), 2]);
  
  const encrypted = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv: nonce },
    aesKey,
    paddedPayload
  );

  return {
    encrypted: new Uint8Array(encrypted),
    salt,
    serverPublicKey,
  };
}

async function sendPushNotification(
  subscription: { endpoint: string; p256dh: string; auth: string },
  payload: object,
  vapidPublicKey: string,
  vapidPrivateKey: string,
  vapidSubject: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const payloadString = JSON.stringify(payload);
    
    // For now, use a simpler approach - just send the notification
    // without encryption (works for testing)
    const { authorization, cryptoKey } = await generateVapidSignature(
      subscription.endpoint,
      vapidPublicKey,
      vapidPrivateKey,
      vapidSubject
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
      body: payloadString,
    });

    if (response.ok || response.status === 201) {
      return { success: true };
    } else if (response.status === 410 || response.status === 404) {
      // Subscription expired or not found
      return { success: false, error: 'subscription_expired' };
    } else {
      const errorText = await response.text();
      console.error(`Push failed: ${response.status} - ${errorText}`);
      return { success: false, error: `${response.status}: ${errorText}` };
    }
  } catch (error) {
    console.error('Push notification error:', error);
    return { success: false, error: error.message };
  }
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const vapidPublicKey = Deno.env.get('VAPID_PUBLIC_KEY')!;
    const vapidPrivateKey = Deno.env.get('VAPID_PRIVATE_KEY')!;
    const vapidSubject = Deno.env.get('VAPID_SUBJECT')!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { action, userId, endpoint, notification } = await req.json();

    if (action === 'send_to_user' && userId) {
      // Send to a specific user
      const { data: subscriptions, error: fetchError } = await supabase
        .from('push_subscriptions')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true);

      if (fetchError) {
        throw new Error(`Failed to fetch subscriptions: ${fetchError.message}`);
      }

      const results = await Promise.all(
        (subscriptions || []).map(async (sub) => {
          const result = await sendPushNotification(
            { endpoint: sub.endpoint, p256dh: sub.p256dh, auth: sub.auth },
            notification,
            vapidPublicKey,
            vapidPrivateKey,
            vapidSubject
          );

          // Remove expired subscriptions
          if (!result.success && result.error === 'subscription_expired') {
            await supabase
              .from('push_subscriptions')
              .delete()
              .eq('id', sub.id);
          }

          return result;
        })
      );

      return new Response(
        JSON.stringify({ success: true, results }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'send_to_endpoint' && endpoint) {
      // Send to a specific endpoint
      const { data: subscription, error: fetchError } = await supabase
        .from('push_subscriptions')
        .select('*')
        .eq('endpoint', endpoint)
        .eq('is_active', true)
        .single();

      if (fetchError || !subscription) {
        throw new Error('Subscription not found');
      }

      const result = await sendPushNotification(
        { endpoint: subscription.endpoint, p256dh: subscription.p256dh, auth: subscription.auth },
        notification,
        vapidPublicKey,
        vapidPrivateKey,
        vapidSubject
      );

      return new Response(
        JSON.stringify({ success: result.success, error: result.error }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'send_climate_alerts') {
      // Send to all active subscriptions (for cron job)
      const { data: subscriptions, error: fetchError } = await supabase
        .from('push_subscriptions')
        .select('*')
        .eq('is_active', true);

      if (fetchError) {
        throw new Error(`Failed to fetch subscriptions: ${fetchError.message}`);
      }

      let sent = 0;
      let failed = 0;

      for (const sub of subscriptions || []) {
        // Check weather conditions for this subscription
        if (sub.latitude && sub.longitude) {
          try {
            const weatherApiKey = Deno.env.get('OPENWEATHER_API_KEY');
            const weatherRes = await fetch(
              `https://api.openweathermap.org/data/2.5/weather?lat=${sub.latitude}&lon=${sub.longitude}&units=metric&appid=${weatherApiKey}`
            );
            const weather = await weatherRes.json();

            const alerts: string[] = [];
            const temp = weather.main?.temp || 0;
            const humidity = weather.main?.humidity || 0;

            if (temp >= (sub.temperature_threshold || 24)) {
              alerts.push(`🌡️ Temperature: ${temp.toFixed(1)}°C`);
            }
            if (humidity >= (sub.humidity_threshold || 70)) {
              alerts.push(`💧 Humidity: ${humidity}%`);
            }

            // Get UV index
            const uvRes = await fetch(
              `https://api.openweathermap.org/data/2.5/uvi?lat=${sub.latitude}&lon=${sub.longitude}&appid=${weatherApiKey}`
            );
            const uvData = await uvRes.json();
            const uv = uvData.value || 0;

            if (uv >= (sub.uv_threshold || 6)) {
              alerts.push(`☀️ UV Index: ${uv}`);
            }

            if (alerts.length > 0) {
              const result = await sendPushNotification(
                { endpoint: sub.endpoint, p256dh: sub.p256dh, auth: sub.auth },
                {
                  title: '🚨 Climate Alert',
                  body: `Conditions may trigger sweating:\n${alerts.join('\n')}`,
                  tag: 'climate-alert',
                  type: 'critical',
                  url: '/climate',
                },
                vapidPublicKey,
                vapidPrivateKey,
                vapidSubject
              );

              if (result.success) {
                sent++;
              } else {
                failed++;
                if (result.error === 'subscription_expired') {
                  await supabase
                    .from('push_subscriptions')
                    .delete()
                    .eq('id', sub.id);
                }
              }
            }
          } catch (err) {
            console.error('Weather check failed for subscription:', sub.id, err);
            failed++;
          }
        }
      }

      return new Response(
        JSON.stringify({ success: true, sent, failed, total: subscriptions?.length || 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Edge function error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
