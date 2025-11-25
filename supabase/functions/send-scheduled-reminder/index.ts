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
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('🔔 Scheduled reminder triggered at:', new Date().toISOString());

    // Get all users with notification preferences enabled
    const { data: preferences, error: prefError } = await supabase
      .from('notification_preferences')
      .select('user_id, enabled')
      .eq('enabled', true);

    if (prefError) {
      console.error('Error fetching preferences:', prefError);
      throw prefError;
    }

    console.log(`Found ${preferences?.length || 0} users with notifications enabled`);

    // For each user, create a climate notification
    const notifications = preferences?.map(pref => ({
      user_id: pref.user_id,
      title: '⏰ Time to Log Your Episode',
      body: 'It\'s been 4 hours. Please log your current sweat level to track patterns.',
      triggers: ['scheduled-reminder'],
      weather_data: {},
      read: false,
      dismissed: false
    })) || [];

    if (notifications.length > 0) {
      const { error: insertError } = await supabase
        .from('climate_notifications')
        .insert(notifications);

      if (insertError) {
        console.error('Error inserting notifications:', insertError);
        throw insertError;
      }

      console.log(`✅ Successfully sent ${notifications.length} scheduled reminders`);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Sent ${notifications.length} reminders`,
        timestamp: new Date().toISOString()
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Error in send-scheduled-reminder:', error);
    
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
