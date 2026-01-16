import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Minimum cron secret length for security
const MIN_CRON_SECRET_LENGTH = 32;

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

// Web Push VAPID implementation
// Accepts either:
// - Raw VAPID private key (32 bytes, base64url) like web-push generates
// - PKCS8 DER private key (commonly ~138 bytes when decoded)
// Public key is expected to be the uncompressed P-256 point (65 bytes) in base64url
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
  const payload = {
    aud: audience,
    exp: now + 12 * 60 * 60, // 12 hours
    sub: vapidSubject,
  };

  const base64UrlEncodeJson = (obj: object): string => {
    const json = JSON.stringify(obj);
    const bytes = new TextEncoder().encode(json);
    return bytesToBase64Url(bytes);
  };

  // Normalize public key (accept 64 bytes without 0x04 prefix)
  let publicKeyBytes = base64UrlToBytes(vapidPublicKey);
  if (publicKeyBytes.length === 64) {
    const fullPublicKey = new Uint8Array(65);
    fullPublicKey[0] = 0x04;
    fullPublicKey.set(publicKeyBytes, 1);
    publicKeyBytes = fullPublicKey;
  }
  if (publicKeyBytes.length !== 65 || publicKeyBytes[0] !== 0x04) {
    console.error(`Invalid VAPID public key length/format: ${publicKeyBytes.length}`);
    throw new Error(`Invalid VAPID public key format (expected 65 bytes uncompressed P-256 point)`);
  }

  const normalizedVapidPublicKey = bytesToBase64Url(publicKeyBytes);

  // Decode private key
  const privateKeyBytes = base64UrlToBytes(vapidPrivateKey);

  let signingKey: CryptoKey;

  // Case A: raw 32-byte private key scalar (d)
  if (privateKeyBytes.length === 32) {
    const x = publicKeyBytes.slice(1, 33);
    const y = publicKeyBytes.slice(33, 65);

    const jwk = {
      kty: "EC",
      crv: "P-256",
      x: bytesToBase64Url(x),
      y: bytesToBase64Url(y),
      d: bytesToBase64Url(privateKeyBytes),
    };

    signingKey = await crypto.subtle.importKey(
      "jwk",
      jwk,
      { name: "ECDSA", namedCurve: "P-256" },
      false,
      ["sign"]
    );
  } else {
    // Case B: PKCS8 DER private key
    // This matches the current failing logs: decoded length ~138 bytes.
    try {
      signingKey = await crypto.subtle.importKey(
        "pkcs8",
        privateKeyBytes.buffer,
        { name: "ECDSA", namedCurve: "P-256" },
        false,
        ["sign"]
      );
    } catch (e) {
      console.error('Failed to import PKCS8 VAPID private key:', e);
      throw new Error(
        `Invalid VAPID private key format (decoded ${privateKeyBytes.length} bytes). ` +
          `Expected 32-byte raw key or PKCS8 DER.`
      );
    }
  }

  const unsignedToken = `${base64UrlEncodeJson(header)}.${base64UrlEncodeJson(payload)}`;

  const signatureBuffer = await crypto.subtle.sign(
    { name: "ECDSA", hash: "SHA-256" },
    signingKey,
    new TextEncoder().encode(unsignedToken)
  );

  const signatureBase64Url = bytesToBase64Url(new Uint8Array(signatureBuffer));
  const jwt = `${unsignedToken}.${signatureBase64Url}`;

  return {
    authorization: `vapid t=${jwt}, k=${normalizedVapidPublicKey}`,
    cryptoKey: normalizedVapidPublicKey,
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
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const vapidPublicKey = Deno.env.get('VAPID_PUBLIC_KEY')!;
    const vapidPrivateKey = Deno.env.get('VAPID_PRIVATE_KEY')!;
    const vapidSubject = Deno.env.get('VAPID_SUBJECT')!;
    const cronSecret = Deno.env.get('CRON_SECRET');

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { action, userId, endpoint, notification } = await req.json();
    
    // For send_climate_alerts, require strong cron secret (for scheduled jobs only)
    if (action === 'send_climate_alerts') {
      const cronHeader = req.headers.get('x-cron-secret');
      
      // Validate cron secret exists and is strong enough
      if (!cronSecret || cronSecret.length < MIN_CRON_SECRET_LENGTH) {
        console.error('CRON_SECRET must be at least 32 characters for security');
        return new Response(
          JSON.stringify({ error: 'Server configuration error - cron secret not properly configured' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      if (!cronHeader || cronHeader !== cronSecret) {
        console.error('Unauthorized cron attempt - invalid or missing cron secret');
        return new Response(
          JSON.stringify({ error: 'Unauthorized - this action requires cron authentication' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    } else {
      // For user-specific actions (send_to_user, send_to_endpoint), require JWT auth
      const authHeader = req.headers.get('authorization');
      if (!authHeader?.startsWith('Bearer ')) {
        return new Response(
          JSON.stringify({ error: 'Unauthorized - missing or invalid authorization header' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Validate the JWT
      const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
        global: { headers: { Authorization: authHeader } }
      });
      
      const token = authHeader.replace('Bearer ', '');
      const { data: claimsData, error: claimsError } = await supabaseAuth.auth.getClaims(token);
      
      if (claimsError || !claimsData?.claims?.sub) {
        console.error('JWT validation failed:', claimsError);
        return new Response(
          JSON.stringify({ error: 'Unauthorized - invalid token' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      const authenticatedUserId = claimsData.claims.sub as string;
      
      // For send_to_user, ensure user can only send to themselves
      if (action === 'send_to_user' && userId && userId !== authenticatedUserId) {
        return new Response(
          JSON.stringify({ error: 'Forbidden - cannot send notifications to other users' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      // For send_to_endpoint, verify the endpoint belongs to the authenticated user
      if (action === 'send_to_endpoint' && endpoint) {
        const { data: subscriptionCheck } = await supabase
          .from('push_subscriptions')
          .select('user_id')
          .eq('endpoint', endpoint)
          .single();
        
        if (subscriptionCheck && subscriptionCheck.user_id !== authenticatedUserId) {
          return new Response(
            JSON.stringify({ error: 'Forbidden - endpoint does not belong to authenticated user' }),
            { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }
    }

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

      // Smart risk calculation based on hyperhidrosis research
      const calculateSweatRisk = (temp: number, humidity: number, uv: number) => {
        // Calculate heat index for more accurate assessment
        const tempF = (temp * 9/5) + 32;
        let heatIndexC = temp;
        if (tempF >= 80) {
          const hiF = -42.379 + 2.04901523 * tempF + 10.14333127 * humidity
            - 0.22475541 * tempF * humidity - 0.00683783 * tempF * tempF
            - 0.05481717 * humidity * humidity + 0.00122874 * tempF * tempF * humidity
            + 0.00085282 * tempF * humidity * humidity - 0.00000199 * tempF * tempF * humidity * humidity;
          heatIndexC = (hiF - 32) * 5/9;
        }
        
        const effectiveTemp = Math.max(temp, heatIndexC);
        
        // Risk levels based on hyperhidrosis research
        // Below 24°C: Safe, 24-27°C: Low, 28-31°C: Moderate, 32-35°C: High, 35+°C: Extreme
        if (effectiveTemp < 24) return { level: 'safe', shouldAlert: false };
        if (effectiveTemp < 28) return { level: 'low', shouldAlert: false };
        if (effectiveTemp < 32) {
          // Moderate risk - only alert if humidity is also high
          return { level: 'moderate', shouldAlert: humidity >= 70 };
        }
        if (effectiveTemp < 35) return { level: 'high', shouldAlert: true };
        return { level: 'extreme', shouldAlert: true };
      };

      for (const sub of subscriptions || []) {
        // Check weather conditions for this subscription
        if (sub.latitude && sub.longitude) {
          try {
            const weatherApiKey = Deno.env.get('OPENWEATHER_API_KEY');
            const weatherRes = await fetch(
              `https://api.openweathermap.org/data/2.5/weather?lat=${sub.latitude}&lon=${sub.longitude}&units=metric&appid=${weatherApiKey}`
            );
            const weather = await weatherRes.json();

            const temp = weather.main?.temp || 0;
            const humidity = weather.main?.humidity || 0;

            // Get UV index
            const uvRes = await fetch(
              `https://api.openweathermap.org/data/2.5/uvi?lat=${sub.latitude}&lon=${sub.longitude}&appid=${weatherApiKey}`
            );
            const uvData = await uvRes.json();
            const uv = uvData.value || 0;

            // Use smart risk calculation
            const risk = calculateSweatRisk(temp, humidity, uv);
            
            // Also check user-defined thresholds as additional triggers
            const alerts: string[] = [];
            const userTempThreshold = sub.temperature_threshold || 28; // Updated default
            const userHumidityThreshold = sub.humidity_threshold || 70;
            const userUvThreshold = sub.uv_threshold || 6;
            
            if (temp >= userTempThreshold) {
              alerts.push(`🌡️ Temperature: ${temp.toFixed(1)}°C`);
            }
            if (humidity >= userHumidityThreshold) {
              alerts.push(`💧 Humidity: ${humidity}%`);
            }
            if (uv >= userUvThreshold) {
              alerts.push(`☀️ UV Index: ${uv}`);
            }

            // Only send notification if risk is moderate+ OR user thresholds exceeded
            if (risk.shouldAlert || alerts.length > 0) {
              const riskMessage = risk.level === 'extreme' 
                ? 'Extreme heat - stay indoors with AC'
                : risk.level === 'high' 
                ? 'High sweat risk - use cooling devices'
                : risk.level === 'moderate' 
                ? 'Sweating likely - prepare cooling aids'
                : 'Warm conditions - monitor symptoms';

              const result = await sendPushNotification(
                { endpoint: sub.endpoint, p256dh: sub.p256dh, auth: sub.auth },
                {
                  title: `🚨 ${risk.level === 'extreme' || risk.level === 'high' ? 'High Risk' : 'Climate'} Alert`,
                  body: alerts.length > 0 
                    ? `${riskMessage}\n${alerts.join('\n')}`
                    : riskMessage,
                  tag: 'climate-alert',
                  type: risk.level === 'extreme' || risk.level === 'high' ? 'critical' : 'warning',
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
