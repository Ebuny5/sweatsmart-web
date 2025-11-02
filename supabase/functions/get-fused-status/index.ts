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
    const { eda, palmResult } = await req.json();
    const API_KEY = Deno.env.get('GOOGLE_AI_STUDIO_API_KEY');
    
    if (!API_KEY) {
      throw new Error("GOOGLE_AI_STUDIO_API_KEY not configured");
    }

    const prompt = `A wearable device reports an EDA reading of ${eda.toFixed(2)} μS and a palm scan reports "${palmResult}".
Based on these two inputs, provide a fused analysis of the user's state.
Output a JSON object with 'status' and 'explanation'.

Guidelines for 'status' (these align with the sensor's simulation modes):
- "Stable": EDA is in the resting range (e.g., < 5.0) and the palm scan shows "No significant moisture.".
- "Early Alert": EDA is in the active range (e.g., 5.0-10.0) OR the palm scan shows "Moisture detected." when EDA is below 10.0.
- "Episode Likely": EDA is in the trigger range (e.g., >= 10.0) OR EDA is in the active range (5.0-10.0) and the palm scan also shows "Moisture detected.".

The 'explanation' should be a brief, professional judgment explaining the result to the user.
Example for "Early Alert": "Your EDA reading is elevated, suggesting an increase in physiological arousal. Consider monitoring your state."`;

    const responseSchema = {
      type: "object",
      properties: {
        status: {
          type: "string",
          enum: ['Stable', 'Early Alert', 'Episode Likely'],
          description: "The assessed user state."
        },
        explanation: {
          type: "string",
          description: "A concise, professional explanation for the status based on the inputs, suitable for the user to read."
        }
      },
      required: ['status', 'explanation']
    };

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema: responseSchema,
        }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gemini API error:', errorText);
      throw new Error('Failed to get fused status');
    }

    const result = await response.json();
    const jsonString = result.candidates[0].content.parts[0].text.trim();
    const data = JSON.parse(jsonString);

    // Validate response
    if (!data.status || !['Stable', 'Early Alert', 'Episode Likely'].includes(data.status) || !data.explanation) {
      throw new Error("Invalid fused analysis in response");
    }

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in get-fused-status:', error);
    
    // Fallback logic
    const { eda, palmResult } = await req.json();
    let fallbackData;
    
    if (eda >= 10.0 || (eda >= 5.0 && palmResult === 'Moisture detected.')) {
      fallbackData = { 
        status: 'Episode Likely', 
        explanation: 'High stress indicators detected based on sensor readings and palm scan. Please take a moment to relax and re-center.' 
      };
    } else if (eda >= 5.0 || palmResult === 'Moisture detected.') {
      fallbackData = { 
        status: 'Early Alert', 
        explanation: 'Slight elevation in stress indicators detected. Consider taking a short break or a few deep breaths.' 
      };
    } else {
      fallbackData = { 
        status: 'Stable', 
        explanation: 'All clear. Your readings are within the normal range.' 
      };
    }
    
    return new Response(JSON.stringify(fallbackData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
