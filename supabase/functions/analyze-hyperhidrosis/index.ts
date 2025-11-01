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
      description: "The suspected source of the moisture. Examples: 'Hyperhidrosis', 'Exertional Sweat', 'External Moisture', 'Dry Skin (No visible moisture)', 'Uncertain'."
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
      description: "A brief note explaining the reasoning, especially if the analysis is ambiguous."
    },
    visualAssessment: {
      type: "object",
      properties: {
        isDry: {
          type: "boolean",
          description: "True if skin appears visually dry (no droplets, no sheen, normal texture)."
        },
        moistureLevel: {
          type: "number",
          description: "0 = completely dry, 100 = dripping wet"
        },
        cues: {
          type: "array",
          items: { type: "string" },
          description: "Key visual cues observed (e.g., 'beading', 'sheen', 'pooling')."
        }
      },
      required: ['isDry', 'moistureLevel']
    },
    decision: {
      type: "object",
      properties: {
        primary: { type: "string", description: "Primary decision summary" },
        rationale: { type: "string", description: "Short explanation of how the decision was made" }
      },
      required: ['primary', 'rationale']
    }
  },
  required: ['confidence', 'severity', 'sweatGlandActivity', 'moistureSource', 'detectedTriggers', 'treatmentRecommendations', 'analysisNotes', 'visualAssessment', 'decision']
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const reqBody = await req.json();
    const { imageData, hrData, gsrData, sensorReliability = 'low', simulationScenario } = reqBody;

    console.log('=== GEMINI API DEBUG START ===');
    console.log('GOOGLE_AI_STUDIO_API_KEY exists:', !!API_KEY);
    console.log('Incoming imageData length:', imageData ? imageData.length : 'NO IMAGE DATA');
    console.log('Heart Rate:', hrData);
    console.log('GSR:', gsrData);
    console.log('Sensor reliability:', sensorReliability);
    console.log('Simulation scenario:', simulationScenario || 'none');

    if (!API_KEY) {
      throw new Error('GOOGLE_AI_STUDIO_API_KEY is not configured');
    }

    // Remove data URL prefix if present
    const base64Data = imageData.replace(/^data:image\/[a-z]+;base64,/, '');
    const mimeType = imageData.match(/^data:(image\/[a-z]+);base64,/)?.[1] || 'image/jpeg';
    
    console.log('Base64 length:', base64Data.length);
    console.log('MIME type:', mimeType);

    const prompt = `You are a specialized dermatological AI assistant for SweatSmart.guru.

Goal: Produce a consistent, medically grounded assessment from an image. Prioritize VISUAL evidence first, then optionally correlate with sensors.

Sensor reliability: ${'${sensorReliability}'} (if 'low' this indicates DEMO sensors and must not override visual dryness). Simulation: ${'${simulationScenario || "none"}'}.

STRICT DRYNESS RULES (must execute before anything else):
- Determine if the skin is visually DRY (no sweat droplets, no sheen, normal texture, no maceration).
- Return visualAssessment.isDry and visualAssessment.moistureLevel (0 dry → 100 dripping).
- If isDry = true: You MUST set:
  - moistureSource = "Dry Skin (No visible moisture)"
  - severity.level ≤ 2 with assessment like "None/Very Mild"
  - sweatGlandActivity.level ≤ 10 with assessment "Inactive/Normal"
  - detectedTriggers = ["None apparent"]
  - decision.primary = "No hyperhidrosis"
  - Do NOT classify as hyperhidrosis even if sensors are elevated.

VISUAL ANALYSIS FRAMEWORK:
1) Moisture patterns: beading (hyperhidrosis), uniform sheen (oil/lotion), pooling/streaks (external water)
2) Skin condition: maceration, redness, peeling, clammy vs wet
3) If not dry: correlate with sensors cautiously. Visual evidence ALWAYS overrides sensors, especially when sensorReliability = 'low'.
4) Triggers: Stress/Exertion/Idiopathic vs External (washing, lotion, environment)

Sensor Data Provided:
- Heart Rate: ${'${hrData ?? "N/A"}'} bpm
- GSR: ${'${gsrData ?? "N/A"}'} µS

Output requirements:
- Follow the JSON schema exactly.
- Be specific in analysisNotes and decision.rationale (explain key cues and any conflicts).
- Keep confidence 0-100 reflecting visual certainty; do not inflate due to sensors when reliability is low.`;

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

    // Post-process to enforce dryness override and de-weight demo sensors
    const isDry = analysis?.visualAssessment?.isDry === true;
    if (isDry) {
      analysis.moistureSource = 'Dry Skin (No visible moisture)';
      analysis.severity = { level: Math.min(Number(analysis?.severity?.level ?? 2), 2), assessment: 'None/Very Mild' };
      analysis.sweatGlandActivity = { level: Math.min(Number(analysis?.sweatGlandActivity?.level ?? 10), 10), assessment: 'Inactive/Normal' };
      if (!Array.isArray(analysis.detectedTriggers) || analysis.detectedTriggers.length === 0) {
        analysis.detectedTriggers = ['None apparent'];
      }
      analysis.treatmentRecommendations = analysis.treatmentRecommendations || {};
      analysis.treatmentRecommendations.primary = 'No treatment required';
      analysis.treatmentRecommendations.alternative = analysis.treatmentRecommendations.alternative || ['Keep hands dry; avoid occlusive lotions before scan'];
      analysis.decision = analysis.decision || {};
      analysis.decision.primary = 'No hyperhidrosis';
      analysis.decision.rationale = (analysis.decision.rationale ? analysis.decision.rationale + ' ' : '') + 'Visual dryness detected; sensors (if any) do not override visual evidence.';
      analysis.confidence = Math.max(Number(analysis.confidence ?? 70), 85);
    }

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