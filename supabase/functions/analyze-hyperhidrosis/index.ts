import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const googleAIKey = Deno.env.get('GOOGLE_AI_STUDIO_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { imageData } = await req.json();

    // === GOOGLE AI DEBUG START ===
    console.log('=== GOOGLE AI DEBUG START ===');
    console.log('API Key exists:', !!googleAIKey);
    console.log('API Key first 10 chars:', googleAIKey ? googleAIKey.substring(0, 10) + '...' : 'MISSING');
    console.log('Incoming imageData length:', imageData ? imageData.length : 'NO IMAGE DATA');

    if (!googleAIKey) {
      throw new Error('Google AI Studio API key not configured');
    }

    // Remove data URL prefix if present
    const base64Data = imageData.replace(/^data:image\/[a-z]+;base64,/, '');
    console.log('Base64 length after strip:', base64Data ? base64Data.length : 'N/A');

    const endpointUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${googleAIKey}`;
    console.log('API Endpoint URL:', endpointUrl);

    const requestBody = {
      contents: [
        {
          parts: [
            {
              text: "CRITICAL INSTRUCTION: Your primary goal is to distinguish between actual hyperhidrosis (sweating) and external moisture (water, lotion, oil). This is the most important part of your analysis.\n\nYou are a sophisticated AI model called \"SweatSmart\" specializing in the analysis of hyperhidrosis from images of palms, feet, and soles.\n\nYour task is to analyze the provided image. Pay close attention to visual cues:\n- **Hyperhidrosis Sweat:** Often originates from pores, forming distinct, tiny beads or a sheen that follows skin lines and contours. The skin may look glistening and clammy.\n- **External Water:** May coat the surface more uniformly, show drip marks, have larger, irregular droplets not associated with pores, or reflect light in a way that looks like a film of water.\n\nIf you detect signs that the wetness could be from an external source like water, you MUST:\n1. Lower the confidence score significantly (e.g., below 50).\n2. Set the severity level to a low score (e.g., 1 or 2).\n3. Your 'analysisNotes' MUST state that an external water source is suspected as the primary reason for the low confidence.\n\nOnly if you are confident the moisture is from sweating should you provide a high confidence score and a corresponding severity assessment.\n\nProvide your final, detailed assessment in a valid JSON format that adheres to the provided schema. Do not include any text, markdown, or code block formatting before or after the JSON object."
            },
            {
              inlineData: {
                mimeType: "image/jpeg",
                data: base64Data
              }
            }
          ]
        }
      ],
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: {
          type: "OBJECT",
          properties: {
            confidence: { type: "NUMBER" },
            severity: {
              type: "OBJECT",
              properties: {
                level: { type: "NUMBER" },
                assessment: { type: "STRING" }
              }
            },
            sweatGlandActivity: {
              type: "OBJECT",
              properties: {
                level: { type: "NUMBER" },
                assessment: { type: "STRING" }
              }
            },
            detectedTriggers: {
              type: "ARRAY",
              items: { type: "STRING" }
            },
            treatmentRecommendations: {
              type: "OBJECT",
              properties: {
                primary: { type: "STRING" },
                alternative: { type: "ARRAY", items: { type: "STRING" } }
              }
            },
            analysisNotes: { type: "STRING" }
          }
        }
      }
    };

    // Log request payload structure without dumping full base64
    try {
      const payloadPreview = {
        ...requestBody,
        contents: [
          {
            parts: [
              { text: '[INSTRUCTIONS_OMITTED_FOR_BREVITY]' },
              { inlineData: { mimeType: 'image/jpeg', data: `[base64 length: ${base64Data.length}]` } }
            ]
          }
        ]
      };
      console.log('Request payload structure:', JSON.stringify(payloadPreview, null, 2));
    } catch (e) {
      console.warn('Failed to serialize request payload preview:', e);
    }

    const headers = { 'Content-Type': 'application/json' };
    console.log('Making API request to:', endpointUrl);
    console.log('Request headers:', headers);
    console.log('Request method:', 'POST');

    const response = await fetch(endpointUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(requestBody),
    });

    console.log('Response status:', response.status);
    try {
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));
    } catch (_) {}

    const rawResponse = await response.text();
    console.log('Raw response:', rawResponse);

    if (!response.ok) {
      console.error('Google AI API Error (non-OK status):', response.status, rawResponse);
      
      // Handle quota exceeded errors specifically
      if (response.status === 429) {
        throw new Error('Google AI API quota exceeded. Please try again later.');
      }
      
      throw new Error(`Google AI API error: ${response.status} - ${rawResponse}`);
    }

    let data;
    try {
      data = JSON.parse(rawResponse);
    } catch (parseErr) {
      console.error('Failed to parse JSON response:', parseErr);
      throw new Error('Invalid response format from Google AI (non-JSON)');
    }
    
    if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
      console.error('Unexpected response shape:', JSON.stringify(data));
      throw new Error('Invalid response format from Google AI');
    }

    const analysisText = data.candidates[0].content.parts[0].text;
    console.log('Analysis text received (first 200 chars):', analysisText?.slice(0, 200));
    const analysis = JSON.parse(analysisText);

    return new Response(JSON.stringify(analysis), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('=== GOOGLE AI ERROR DETAILS ===');
    console.error('Error type:', error?.constructor?.name);
    console.error('Error message:', error?.message);
    console.error('Error stack:', error?.stack);
    // If this error wrapped a response (when thrown above)
    console.error('Response status (if any):', error?.response?.status);
    try { console.error('Response data (if any):', await error?.response?.text?.()); } catch (_) {}
    console.error('=== END ERROR DETAILS ===');

    // Return a structured error response that matches the expected schema
    const errorResponse = { 
      error: error?.message ?? 'Unknown error',
      confidence: 0,
      severity: { level: 1, assessment: "Analysis unavailable" },
      sweatGlandActivity: { level: 1, assessment: "Unable to analyze" },
      detectedTriggers: [],
      treatmentRecommendations: { primary: "Consult healthcare provider", alternative: [] },
      analysisNotes: `Analysis failed: ${error?.message}. Please check logs for details and try again later.`
    };
    
    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});