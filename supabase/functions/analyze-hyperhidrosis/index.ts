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
    const { imageData, hrData, gsrData } = await req.json();

    console.log('=== GEMINI API DEBUG START ===');
    console.log('GOOGLE_AI_STUDIO_API_KEY exists:', !!API_KEY);
    console.log('Incoming imageData length:', imageData ? imageData.length : 'NO IMAGE DATA');
    console.log('Heart Rate:', hrData);
    console.log('GSR:', gsrData);

    if (!API_KEY) {
      throw new Error('GOOGLE_AI_STUDIO_API_KEY is not configured');
    }

    // Remove data URL prefix if present
    const base64Data = imageData.replace(/^data:image\/[a-z]+;base64,/, '');
    const mimeType = imageData.match(/^data:(image\/[a-z]+);base64,/)?.[1] || 'image/jpeg';
    
    console.log('Base64 length:', base64Data.length);
    console.log('MIME type:', mimeType);

    const prompt = `You are a specialized dermatological AI assistant for SweatSmart.guru. Your purpose is to analyze images of any skin area (palms, soles, face, underarms, etc.) where users detect hyperhidrosis symptoms.

**CORE RULES:**
- Analysis MUST be based PRIMARILY on visual characteristics
- Sensor data (GSR, Heart Rate) is SECONDARY support only
- Visual evidence overrides conflicting sensor data

**VISUAL ANALYSIS FRAMEWORK:**
1. **Moisture Pattern Analysis:**
   - Look for tiny discrete droplets along skin lines = Hyperhidrosis
   - Look for uniform sheen/glossy film = Lotion/Oil
   - Look for irregular pooling/streaking = External Water

2. **Skin Assessment:**
   - Check for maceration (white soggy skin), redness, peeling
   - Note if skin appears "clammy" (hyperhidrosis) vs "wet" (external)

3. **Sensor Correlation:**
   - High GSR (>5 µS) + Visual Beading = Strong Hyperhidrosis
   - Low GSR (<1.5 µS) + Visual Sheen = Strong External Moisture
   - Conflicting data: Explain conflict, prioritize visual diagnosis

4. **Trigger Detection:**
   - Hyperhidrosis: Consider "Stress" (if high HR), "Exertional", "Idiopathic"
   - External: "Recent washing", "Lotion", "Environmental contact"

**Sensor Data Provided:**
- Heart Rate: ${hrData || 'N/A'} bpm
- GSR: ${gsrData || 'N/A'} µS

**Instructions:** Perform step-by-step visual analysis first, then correlate with sensor data. Provide specific triggers and personalized recommendations.

Provide your final assessment in valid JSON format that adheres to the provided schema. Do not include any text, markdown, or code block formatting before or after the JSON object.`;

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
    console.error('Analysis error:', error?.message);

    const errorResponse = { 
      error: 'Unable to complete analysis. Please try again.',
      confidence: 0,
      severity: { level: 1, assessment: "Analysis unavailable" },
      sweatGlandActivity: { level: 1, assessment: "Unable to analyze" },
      moistureSource: "Uncertain",
      detectedTriggers: [],
      treatmentRecommendations: { primary: "Consult healthcare provider", alternative: [] },
      analysisNotes: 'Analysis temporarily unavailable'
    };
    
    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});