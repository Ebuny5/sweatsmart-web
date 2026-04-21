import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// Input validation constants
const MIN_LATITUDE = -90;
const MAX_LATITUDE = 90;
const MIN_LONGITUDE = -180;
const MAX_LONGITUDE = 180;

type WeatherResult = {
  temperature: number;
  humidity: number;
  /** Real UV index. null when API didn't return one (no fake fallback). */
  uvIndex: number | null;
  /** 'sunny' | 'partly_cloudy' | 'overcast' — derived from cloud cover & weather code. */
  sky: 'sunny' | 'partly_cloudy' | 'overcast';
  description?: string;
  icon?: string;
  location?: string;
  timestamp: number;
};

// Best-effort in-memory cache to reduce OpenWeather calls.
// Note: Edge functions are ephemeral; this helps when the instance is warm.
const WEATHER_CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes
const weatherCache = new Map<string, { ts: number; payload: WeatherResult }>();

function cacheKey(lat: number, lon: number) {
  // Round to ~110m precision to avoid cache fragmentation
  return `${lat.toFixed(3)},${lon.toFixed(3)}`;
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate JWT authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: claimsError } = await supabaseClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { latitude, longitude } = await req.json();
    
    // Input validation
    if (typeof latitude !== 'number' || isNaN(latitude) || latitude < MIN_LATITUDE || latitude > MAX_LATITUDE) {
      return new Response(
        JSON.stringify({ error: `Latitude must be a number between ${MIN_LATITUDE} and ${MAX_LATITUDE}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (typeof longitude !== 'number' || isNaN(longitude) || longitude < MIN_LONGITUDE || longitude > MAX_LONGITUDE) {
      return new Response(
        JSON.stringify({ error: `Longitude must be a number between ${MIN_LONGITUDE} and ${MAX_LONGITUDE}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const OPENWEATHER_API_KEY = Deno.env.get('OPENWEATHER_API_KEY');
    
    if (!OPENWEATHER_API_KEY) {
      console.log('No OpenWeather API key, using fallback');
      return new Response(
        JSON.stringify({ 
          simulated: true,
          error: 'Weather API not configured',
          data: { temperature: 25, humidity: 60, uvIndex: 5 }
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Fetching weather for: ${latitude}, ${longitude}`);

    // Serve from cache when possible
    const key = cacheKey(latitude, longitude);
    const cached = weatherCache.get(key);
    if (cached && Date.now() - cached.ts < WEATHER_CACHE_TTL_MS) {
      const payload = { ...cached.payload, cached: true, cacheAgeMs: Date.now() - cached.ts };
      return new Response(
        JSON.stringify(payload),
        {
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
            'Cache-Control': `public, max-age=${Math.floor(WEATHER_CACHE_TTL_MS / 1000)}`,
          },
        }
      );
    }

    // Fetch current weather data
    const weatherUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&units=metric&appid=${OPENWEATHER_API_KEY}`;
    const weatherResponse = await fetch(weatherUrl);
    
    if (!weatherResponse.ok) {
      const errorText = await weatherResponse.text();
      console.error('OpenWeather API error:', weatherResponse.status, errorText);
      throw new Error(`Weather API error: ${weatherResponse.status}`);
    }
    
    const weatherData = await weatherResponse.json();
    console.log('Weather data received');

    // Fetch UV index — prefer One Call 3.0 (`uvi`), fall back to legacy /uvi endpoint.
    // Returns NULL when no real value is available — no silent fake fallback.
    let uvIndex: number | null = null;
    try {
      const oneCallUrl =
        `https://api.openweathermap.org/data/3.0/onecall?lat=${latitude}&lon=${longitude}` +
        `&exclude=minutely,hourly,daily,alerts&units=metric&appid=${OPENWEATHER_API_KEY}`;
      const oneCallRes = await fetch(oneCallUrl);
      if (oneCallRes.ok) {
        const oneCall = await oneCallRes.json();
        const uvi = oneCall?.current?.uvi;
        if (typeof uvi === 'number' && !isNaN(uvi)) {
          uvIndex = uvi;
        }
      } else {
        console.log('One Call 3.0 failed:', oneCallRes.status);
      }
    } catch (e) {
      console.log('One Call UV fetch error:', e);
    }

    if (uvIndex == null) {
      try {
        const uvUrl = `https://api.openweathermap.org/data/2.5/uvi?lat=${latitude}&lon=${longitude}&appid=${OPENWEATHER_API_KEY}`;
        const uvResponse = await fetch(uvUrl);
        if (uvResponse.ok) {
          const uvData = await uvResponse.json();
          if (typeof uvData?.value === 'number' && !isNaN(uvData.value)) {
            uvIndex = uvData.value;
          }
        }
      } catch (uvError) {
        console.log('Legacy UV fetch failed:', uvError);
      }
    }

    // Derive sky condition from cloud cover + weather id (no UV faking).
    const clouds = weatherData.clouds?.all ?? 0;
    const weatherId: number = weatherData.weather?.[0]?.id ?? 800;
    let sky: 'sunny' | 'partly_cloudy' | 'overcast';
    if (weatherId >= 200 && weatherId < 800) {
      sky = 'overcast'; // rain/storm/snow/etc
    } else if (clouds <= 25) {
      sky = 'sunny';
    } else if (clouds <= 70) {
      sky = 'partly_cloudy';
    } else {
      sky = 'overcast';
    }

    const result: WeatherResult = {
      temperature: Math.round(weatherData.main.temp * 10) / 10,
      humidity: weatherData.main.humidity,
      uvIndex: uvIndex == null ? null : Math.round(uvIndex * 10) / 10,
      sky,
      description: weatherData.weather?.[0]?.description || 'Unknown',
      icon: weatherData.weather?.[0]?.icon,
      location: weatherData.name,
      timestamp: Date.now(),
    };

    // Update cache
    weatherCache.set(cacheKey(latitude, longitude), { ts: Date.now(), payload: result });

    console.log('Returning weather data');

    return new Response(
      JSON.stringify(result),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
          'Cache-Control': `public, max-age=${Math.floor(WEATHER_CACHE_TTL_MS / 1000)}`,
        },
      }
    );

  } catch (error) {
    console.error('Error in get-weather-data:', error);
    
    // Return simulated data on error
    return new Response(
      JSON.stringify({ 
        error: 'Weather service temporarily unavailable',
        simulated: true,
        data: { temperature: 25, humidity: 60, uvIndex: 5 }
      }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
