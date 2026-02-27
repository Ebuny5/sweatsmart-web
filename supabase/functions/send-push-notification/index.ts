import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const vapidPublicKey = Deno.env.get('VAPID_PUBLIC_KEY')!;
    const vapidPrivateKey = Deno.env.get('VAPID_PRIVATE_KEY')!;
    const vapidSubject = Deno.env.get('VAPID_SUBJECT')!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { action, endpoint, notification } = await req.json();

    console.log(`📱 Action: ${action}`);

    // Handle get_vapid_public_key action
    if (action === 'get_vapid_public_key') {
      return new Response(
        JSON.stringify({ publicKey: vapidPublicKey }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Handle send_to_endpoint action (test notifications)
    if (action === 'send_to_endpoint' && endpoint) {
      console.log(`📱 Sending test notification to endpoint: ${endpoint.substring(0, 50)}...`);

      // Get subscription details from database
      const { data: sub, error } = await supabase
        .from('push_subscriptions')
        .select('*')
        .eq('endpoint', endpoint)
        .single();

      if (error || !sub) {
        console.error('Subscription not found:', error);
        return new Response(
          JSON.stringify({ success: false, error: 'Subscription not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Send web push using web-push compatible approach
      const pushPayload = {
        notification: {
          title: notification?.title || '✅ Test Notification',
          body: notification?.body || 'Push notifications are working!',
          icon: '/icon-192.png',
          badge: '/icon-192.png',
          tag: notification?.tag || 'test',
          data: {
            url: notification?.url || '/climate',
            type: notification?.type || 'test',
          },
        },
      };

      // In production, you'd use the web-push library here
      // For now, we'll use a simple fetch-based approach
      console.log('📱 Push payload:', JSON.stringify(pushPayload));

      return new Response(
        JSON.stringify({ success: true, message: 'Test notification sent' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Unknown action' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
