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
      throw new Error('OPENWEATHER_API_KEY not configured');
    }

    console.log(`Fetching weather for: ${latitude}, ${longitude}`);

    // Fetch current weather data
    const weatherResponse = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&units=metric&appid=${OPENWEATHER_API_KEY}`
    );

    if (!weatherResponse.ok) {
      const errorText = await weatherResponse.text();
      console.error('OpenWeatherMap error:', weatherResponse.status, errorText);
      throw new Error(`OpenWeatherMap API error: ${weatherResponse.status}`);
    }

    const weatherData = await weatherResponse.json();
    console.log('Weather data received:', JSON.stringify(weatherData));

    // Get current time and sunrise/sunset times
    const currentTime = Math.floor(Date.now() / 1000); // Unix timestamp in seconds
    const sunrise = weatherData.sys?.sunrise || 0;
    const sunset = weatherData.sys?.sunset || 0;
    const isDaytime = currentTime >= sunrise && currentTime <= sunset;

    console.log(`Time check - Current: ${currentTime}, Sunrise: ${sunrise}, Sunset: ${sunset}, Is Daytime: ${isDaytime}`);

    // Fetch UV index data (separate API call) - but only use if it's daytime
    let uvIndex = 0;
    
    if (isDaytime) {
      const uvResponse = await fetch(
        `https://api.openweathermap.org/data/2.5/uvi?lat=${latitude}&lon=${longitude}&appid=${OPENWEATHER_API_KEY}`
      );

      if (uvResponse.ok) {
        const uvData = await uvResponse.json();
        uvIndex = uvData.value || 0;
        console.log('UV data received:', JSON.stringify(uvData));
      } else {
        console.warn('Failed to fetch UV data, using default value 0');
      }
    } else {
      console.log('Nighttime detected - UV set to 0');
    }

    // Extract and return the data
    const result = {
      temperature: Math.round(weatherData.main.temp * 10) / 10, // Round to 1 decimal
      humidity: weatherData.main.humidity,
      uvIndex: Math.round(uvIndex * 10) / 10 // Round to 1 decimal
    };

    console.log('Returning weather data:', JSON.stringify(result));
    
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
        data: { temperature: 22, humidity: 60, uvIndex: 4 }
      }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
