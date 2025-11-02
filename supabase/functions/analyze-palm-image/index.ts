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
    const { base64ImageData } = await req.json();
    const API_KEY = Deno.env.get('GOOGLE_AI_STUDIO_API_KEY');
    
    if (!API_KEY) {
      throw new Error("GOOGLE_AI_STUDIO_API_KEY not configured");
    }

    const prompt = "Analyze the image of a person's palm. Respond with \"Moisture detected.\" if there are visible signs of sweat or moisture (like shininess or droplets). Respond with \"No significant moisture.\" if the palm appears dry. Be concise.";

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [
            { inline_data: { mime_type: 'image/jpeg', data: base64ImageData } },
            { text: prompt }
          ]
        }]
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gemini API error:', errorText);
      throw new Error('Failed to analyze palm image');
    }

    const result = await response.json();
    const resultText = result.candidates[0].content.parts[0].text.trim();
    
    let palmResult = 'No significant moisture.';
    if (resultText === 'Moisture detected.' || resultText === 'No significant moisture.') {
      palmResult = resultText;
    } else {
      console.warn("Unexpected response from palm analysis:", resultText);
    }

    return new Response(JSON.stringify({ result: palmResult }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in analyze-palm-image:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
