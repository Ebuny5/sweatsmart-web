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

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    console.log(`Fetching weather for: ${latitude}, ${longitude}`);

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: 'You are a weather data provider. Return current weather conditions as structured data.'
          },
          {
            role: 'user',
            content: `Provide current weather data for coordinates: latitude ${latitude}, longitude ${longitude}. Return temperature in Celsius, humidity percentage (0-100), and UV index (0-11).`
          }
        ],
        tools: [
          {
            type: 'function',
            function: {
              name: 'provide_weather',
              description: 'Return current weather conditions',
              parameters: {
                type: 'object',
                properties: {
                  temperature: { type: 'number', description: 'Temperature in Celsius' },
                  humidity: { type: 'number', description: 'Humidity percentage 0-100' },
                  uvIndex: { type: 'number', description: 'UV index 0-11' }
                },
                required: ['temperature', 'humidity', 'uvIndex'],
                additionalProperties: false
              }
            }
          }
        ],
        tool_choice: { type: 'function', function: { name: 'provide_weather' } }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI Gateway error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ 
            error: 'Rate limit exceeded. Using simulated data.',
            simulated: true,
            data: { temperature: 22, humidity: 60, uvIndex: 4 }
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ 
            error: 'Credits required. Using simulated data.',
            simulated: true,
            data: { temperature: 22, humidity: 60, uvIndex: 4 }
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const aiResponse = await response.json();
    console.log('AI Response:', JSON.stringify(aiResponse));

    // Extract weather data from tool call
    const toolCall = aiResponse.choices?.[0]?.message?.tool_calls?.[0];
    if (toolCall?.function?.arguments) {
      const weatherData = JSON.parse(toolCall.function.arguments);
      console.log('Weather data:', weatherData);
      
      return new Response(
        JSON.stringify(weatherData),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    throw new Error('Failed to extract weather data from AI response');

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
