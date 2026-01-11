import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { latitude, longitude } = await req.json();
    
    if (!latitude || !longitude) {
      throw new Error('Latitude and longitude are required');
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

    // Fetch current weather data
    const weatherUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&units=metric&appid=${OPENWEATHER_API_KEY}`;
    const weatherResponse = await fetch(weatherUrl);
    
    if (!weatherResponse.ok) {
      const errorText = await weatherResponse.text();
      console.error('OpenWeather API error:', weatherResponse.status, errorText);
      throw new Error(`Weather API error: ${weatherResponse.status}`);
    }
    
    const weatherData = await weatherResponse.json();
    console.log('Weather data received:', JSON.stringify(weatherData));

    // Fetch UV index (separate endpoint)
    let uvIndex = 5; // Default UV
    try {
      const uvUrl = `https://api.openweathermap.org/data/2.5/uvi?lat=${latitude}&lon=${longitude}&appid=${OPENWEATHER_API_KEY}`;
      const uvResponse = await fetch(uvUrl);
      if (uvResponse.ok) {
        const uvData = await uvResponse.json();
        uvIndex = uvData.value || 5;
      }
    } catch (uvError) {
      console.log('UV fetch failed, using estimate:', uvError);
      // Estimate UV based on time of day and weather
      const hour = new Date().getHours();
      if (hour >= 10 && hour <= 14) {
        uvIndex = weatherData.clouds?.all < 50 ? 7 : 4;
      } else if (hour >= 8 && hour <= 16) {
        uvIndex = weatherData.clouds?.all < 50 ? 5 : 3;
      } else {
        uvIndex = 1;
      }
    }

    const result = {
      temperature: Math.round(weatherData.main.temp * 10) / 10,
      humidity: weatherData.main.humidity,
      uvIndex: Math.round(uvIndex * 10) / 10,
      description: weatherData.weather?.[0]?.description || 'Unknown',
      icon: weatherData.weather?.[0]?.icon,
      location: weatherData.name,
      timestamp: Date.now()
    };

    console.log('Returning weather:', JSON.stringify(result));

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in get-weather-data:', error);
    
    // Return simulated data on error
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error',
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