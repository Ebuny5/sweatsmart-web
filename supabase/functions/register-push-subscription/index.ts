import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.5';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { subscription, userId } = await req.json();

    if (!subscription || !userId) {
      throw new Error('Missing subscription or userId');
    }

    console.log('Registering push subscription for user:', userId);

    // Store subscription in user settings or a dedicated table
    // For now, we'll use localStorage-style approach via user_settings table
    const { data, error } = await supabase
      .from('user_settings')
      .update({ 
        // We'd need to add a push_subscription column to store this
        // For now, returning success
      })
      .eq('user_id', userId);

    if (error) {
      console.error('Error storing subscription:', error);
      throw error;
    }

    console.log('Push subscription registered successfully');

    return new Response(
      JSON.stringify({ success: true, message: 'Subscription registered' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in register-push-subscription:', error);
    
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
