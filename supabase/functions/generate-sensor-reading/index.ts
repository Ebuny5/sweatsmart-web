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
    const { mode } = await req.json();
    const API_KEY = Deno.env.get('GOOGLE_AI_STUDIO_API_KEY');
    
    if (!API_KEY) {
      throw new Error("GOOGLE_AI_STUDIO_API_KEY not configured");
    }

    const prompt = `Simulate one wearable sensor reading for a person in a '${mode}' state. Output only JSON with the specified schema.
The 'sim_mode' field must be exactly '${mode}'.
The values for 'EDA_uS' and 'HR_bpm' must fall within the realistic ranges for the chosen '${mode}' mode:
- Resting: EDA 2.0–5.0, HR 60–72
- Active: EDA 5.0–9.0, HR 72–85
- Trigger: EDA 10.0–15.0, HR 85–105

The 'EDA_baseline_uS' and 'HR_baseline_bpm' values should be within the 'Resting' range.
Pick realistic decimals for all numeric values. The timestamp should be a current ISO 8601 string.
The user_id should be a random alphanumeric string.
The notes field should briefly describe the simulation, reflecting the '${mode}' state.`;

    const responseSchema = {
      type: "object",
      properties: {
        user_id: { type: "string", description: "A unique identifier for the user." },
        timestamp: { type: "string", description: "The ISO 8601 timestamp of the reading." },
        sim_mode: { type: "string", description: "The simulated activity mode: Resting, Active, or Trigger." },
        EDA_uS: { type: "number", description: "Electrodermal activity in microsiemens (μS)." },
        HR_bpm: { type: "number", description: "Heart rate in beats per minute (bpm)." },
        EDA_baseline_uS: { type: "number", description: "Baseline electrodermal activity in microsiemens (μS)." },
        HR_baseline_bpm: { type: "number", description: "Baseline heart rate in beats per minute (bpm)." },
        notes: { type: "string", description: "A brief note about the simulated reading." },
      },
      required: ["user_id", "timestamp", "sim_mode", "EDA_uS", "HR_bpm", "EDA_baseline_uS", "HR_baseline_bpm", "notes"]
    };

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema: responseSchema,
          temperature: 1,
        }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gemini API error:', errorText);
      throw new Error('Failed to generate sensor reading');
    }

    const result = await response.json();
    const jsonString = result.candidates[0].content.parts[0].text.trim();
    const data = JSON.parse(jsonString);

    // Enforce correct mode
    if (!data.sim_mode || data.sim_mode !== mode) {
      console.warn(`Mismatched sim_mode: expected ${mode}, got ${data.sim_mode}. Correcting.`);
      data.sim_mode = mode;
    }

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in generate-sensor-reading:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
