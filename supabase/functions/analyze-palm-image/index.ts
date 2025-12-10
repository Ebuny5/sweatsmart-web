import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Retry logic for handling 503 errors
async function fetchWithRetry(
  url: string,
  options: RequestInit,
  maxRetries = 3,
  baseDelay = 1000
): Promise<Response> {
  let lastError: Error | null = null;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(url, options);
      
      if (response.ok) {
        return response;
      }
      
      // If 503 (overloaded), retry
      if (response.status === 503 && attempt < maxRetries) {
        const errorText = await response.text();
        console.warn(`Attempt ${attempt} failed with status 503: ${errorText}`);
        const delay = baseDelay * attempt;
        console.info(`Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      
      // For other errors or last attempt, throw
      const errorText = await response.text();
      throw new Error(`API error ${response.status}: ${errorText}`);
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      if (attempt < maxRetries) {
        const delay = baseDelay * attempt;
        console.warn(`Attempt ${attempt} failed: ${lastError.message}`);
        console.info(`Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError || new Error('All retry attempts failed');
}

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

    const response = await fetchWithRetry(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${API_KEY}`,
      {
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
      }
    );

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
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
