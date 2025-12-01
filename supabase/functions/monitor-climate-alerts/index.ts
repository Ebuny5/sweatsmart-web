import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.5';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface WeatherData {
  temperature: number;
  humidity: number;
  uvIndex: number;
  description: string;
  city: string;
}

async function fetchWeather(lat: number, lon: number): Promise<WeatherData | null> {
  const apiKey = Deno.env.get('OPENWEATHER_API_KEY');
  if (!apiKey) {
    console.error('❌ Missing OPENWEATHER_API_KEY');
    return null;
  }

  try {
    const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`;
    const response = await fetch(url);
    const data = await response.json();

    if (!response.ok) {
      console.error('Weather API error:', data);
      return null;
    }

    return {
      temperature: Math.round(data.main.temp),
      humidity: Math.round(data.main.humidity),
      uvIndex: 0, // Would need separate UV API call
      description: data.weather[0]?.description || 'Clear',
      city: data.name
    };
  } catch (error) {
    console.error('Error fetching weather:', error);
    return null;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('🌤️ Starting climate monitoring check at:', new Date().toISOString());

    // Get all users with climate alerts enabled
    const { data: preferences, error: prefError } = await supabase
      .from('notification_preferences')
      .select('*')
      .eq('enabled', true)
      .eq('location_enabled', true);

    if (prefError) {
      console.error('Error fetching preferences:', prefError);
      throw prefError;
    }

    console.log(`📊 Found ${preferences?.length || 0} users to monitor`);

    let alertsSent = 0;
    let errors = 0;

    // For each user, check their location and weather
    for (const pref of preferences || []) {
      try {
        // Parse location from preferences (stored as JSON string or separate fields)
        // For now, we'll skip users without stored location
        // In production, you'd store lat/lon in the preferences table
        
        // Placeholder: Use a default location or skip
        // You'll need to add lat/lon columns to notification_preferences table
        console.log(`⏭️ Skipping user ${pref.user_id} - location storage not implemented`);
        continue;

        // EXAMPLE OF HOW IT SHOULD WORK (uncomment when lat/lon added to DB):
        /*
        const weather = await fetchWeather(pref.latitude, pref.longitude);
        
        if (!weather) {
          errors++;
          continue;
        }

        const triggers: string[] = [];
        
        // Check thresholds
        if (weather.temperature > (pref.temperature_threshold || 25)) {
          triggers.push(`High Temperature: ${weather.temperature}°C`);
        }
        
        if (weather.humidity > (pref.humidity_threshold || 70)) {
          triggers.push(`High Humidity: ${weather.humidity}%`);
        }
        
        if (weather.uvIndex > (pref.uv_threshold || 6)) {
          triggers.push(`High UV Index: ${weather.uvIndex}`);
        }

        // If any threshold exceeded, create alert
        if (triggers.length > 0) {
          const { error: insertError } = await supabase
            .from('climate_notifications')
            .insert({
              user_id: pref.user_id,
              title: '🌡️ Climate Alert',
              body: `${triggers.join(', ')} in ${weather.city}. Consider indoor activities.`,
              triggers,
              weather_data: weather,
              read: false,
              dismissed: false
            });

          if (insertError) {
            console.error('Error creating alert:', insertError);
            errors++;
          } else {
            alertsSent++;
            console.log(`✅ Alert sent to user ${pref.user_id}`);
          }
        }
        */

      } catch (error) {
        console.error(`Error processing user ${pref.user_id}:`, error);
        errors++;
      }
    }

    console.log(`✅ Monitoring complete: ${alertsSent} alerts sent, ${errors} errors`);

    return new Response(
      JSON.stringify({ 
        success: true,
        monitored: preferences?.length || 0,
        alertsSent,
        errors,
        timestamp: new Date().toISOString(),
        note: 'Location storage not yet implemented - add lat/lon to notification_preferences table'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Error in monitor-climate-alerts:', error);
    
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
