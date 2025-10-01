import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const API_KEY = Deno.env.get('GOOGLE_AI_STUDIO_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Schema matching your working Gemini app
const analysisSchema = {
  type: "object",
  properties: {
    confidence: {
      type: "number",
      description: "A confidence score from 0 to 100 for the overall analysis."
    },
    severity: {
      type: "object",
      properties: {
        level: {
          type: "number",
          description: "A severity score from 1 to 10."
        },
        assessment: {
          type: "string",
          description: "A descriptive assessment (e.g., 'Mild', 'Moderate', 'Severe', 'Very Severe')."
        }
      },
      required: ['level', 'assessment']
    },
    sweatGlandActivity: {
      type: "object",
      properties: {
        level: {
          type: "number",
          description: "An activity level from 0 to 100, representing the percentage of active sweat glands detected."
        },
        assessment: {
          type: "string",
          description: "A descriptive assessment (e.g., 'Normal', 'Active', 'Highly Active')."
        }
      },
      required: ['level', 'assessment']
    },
    moistureSource: {
      type: "string",
      description: "The suspected source of the moisture. Must be one of: 'Hyperhidrosis', 'Exertional Sweat', 'External Moisture', 'Uncertain'."
    },
    detectedTriggers: {
      type: "array",
      items: {
        type: "string"
      },
      description: "An array of potential triggers. If none, provide a default like ['Unknown']."
    },
    treatmentRecommendations: {
      type: "object",
      properties: {
        primary: {
          type: "string",
          description: "The most suitable primary treatment option."
        },
        alternative: {
          type: "array",
          items: {
            type: "string"
          },
          description: "An array of alternative treatment options."
        }
      },
      required: ['primary', 'alternative']
    },
    analysisNotes: {
      type: "string",
      description: "A brief note explaining the reasoning, especially if the analysis is ambiguous. For example, if an external water source is suspected, this note MUST mention it. If confident, state that."
    }
  },
  required: ['confidence', 'severity', 'sweatGlandActivity', 'moistureSource', 'detectedTriggers', 'treatmentRecommendations', 'analysisNotes']
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { imageData } = await req.json();

    console.log('=== GEMINI API DEBUG START ===');
    console.log('GOOGLE_AI_STUDIO_API_KEY exists:', !!API_KEY);
    console.log('Incoming imageData length:', imageData ? imageData.length : 'NO IMAGE DATA');

    if (!API_KEY) {
      throw new Error('GOOGLE_AI_STUDIO_API_KEY is not configured');
    }

    // Remove data URL prefix if present
    const base64Data = imageData.replace(/^data:image\/[a-z]+;base64,/, '');
    const mimeType = imageData.match(/^data:(image\/[a-z]+);base64,/)?.[1] || 'image/jpeg';
    
    console.log('Base64 length:', base64Data.length);
    console.log('MIME type:', mimeType);

    const prompt = `CRITICAL INSTRUCTION: Your primary goal is to determine the source of moisture on the skin. This is the most important part of your analysis.

You are a sophisticated AI model called "SweatSmart" specializing in the analysis of hyperhidrosis from images of palms, feet, and soles.

Your task is to analyze the provided image and classify the moisture source. Pay close attention to visual cues to differentiate between:
- **Hyperhidrosis Sweat:** Originates from pores without an obvious cause like exercise. It appears as distinct, tiny beads or a sheen following skin lines. The skin looks glistening and clammy. This is your primary focus for a positive diagnosis.
- **Exertional Sweat:** Caused by physical activity. While it's sweat, it is not necessarily hyperhidrosis. The presentation might be similar, but it's a normal physiological response. If the context is unknown, note this possibility.
- **External Moisture:** This includes water, lotions, oils, etc. It often coats the surface more uniformly, shows drip marks, has larger, irregular droplets not associated with pores, or reflects light like a film.

Based on your analysis, you MUST:
1. Set the 'moistureSource' field to one of: 'Hyperhidrosis', 'Exertional Sweat', 'External Moisture', or 'Uncertain'.
2. If you suspect 'External Moisture', you MUST lower the confidence score significantly (e.g., below 40) and set severity to a low score (e.g., 1). Your 'analysisNotes' MUST state that an external source is suspected.
3. If you are confident the moisture is from 'Hyperhidrosis', provide a high confidence score and a corresponding severity assessment.
4. If you suspect 'Exertional Sweat' but cannot be sure it's not hyperhidrosis, you can provide a moderate confidence score and note the ambiguity in 'analysisNotes'.

Provide your final, detailed assessment in a valid JSON format that adheres to the provided schema. Do not include any text, markdown, or code block formatting before or after the JSON object.`;

    // Use Gemini API directly with structured output
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${API_KEY}`;
    
    const requestBody = {
      contents: [{
        parts: [
          { text: prompt },
          {
            inline_data: {
              mime_type: mimeType,
              data: base64Data
            }
          }
        ]
      }],
      generationConfig: {
        responseMimeType: 'application/json',
        responseSchema: analysisSchema
      }
    };

    console.log('Making API request to Gemini...');
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    console.log('Response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gemini API error:', errorText);
      throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('Response received from Gemini');

    const analysisText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!analysisText) {
      throw new Error('No analysis text in Gemini response');
    }

    console.log('Analysis text length:', analysisText.length);
    
    const analysis = JSON.parse(analysisText);
    console.log('Analysis parsed successfully');
    console.log('Moisture source:', analysis.moistureSource);
    console.log('Confidence:', analysis.confidence);

    return new Response(JSON.stringify(analysis), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('=== ERROR DETAILS ===');
    console.error('Error type:', error?.constructor?.name);
    console.error('Error message:', error?.message);
    console.error('Error stack:', error?.stack);
    console.error('=== END ERROR DETAILS ===');

    const errorResponse = { 
      error: error?.message ?? 'Unknown error',
      confidence: 0,
      severity: { level: 1, assessment: "Analysis unavailable" },
      sweatGlandActivity: { level: 1, assessment: "Unable to analyze" },
      moistureSource: "Uncertain",
      detectedTriggers: [],
      treatmentRecommendations: { primary: "Consult healthcare provider", alternative: [] },
      analysisNotes: `Analysis failed: ${error?.message}`
    };
    
    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});