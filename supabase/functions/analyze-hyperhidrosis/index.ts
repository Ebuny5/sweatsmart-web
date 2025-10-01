import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

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

    // === AI GATEWAY DEBUG START ===
    console.log('=== AI GATEWAY DEBUG START ===');
    console.log('LOVABLE_API_KEY exists:', !!LOVABLE_API_KEY);
    console.log('LOVABLE_API_KEY first 10 chars:', LOVABLE_API_KEY ? LOVABLE_API_KEY.substring(0, 10) + '...' : 'MISSING');
    console.log('Incoming imageData length:', imageData ? imageData.length : 'NO IMAGE DATA');

    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    // Remove data URL prefix if present
    const base64Data = imageData.replace(/^data:image\/[a-z]+;base64,/, '');
    console.log('Base64 length after strip:', base64Data ? base64Data.length : 'N/A');

    const endpointUrl = 'https://ai.gateway.lovable.dev/v1/chat/completions';
    console.log('API Endpoint URL:', endpointUrl);

    const systemInstruction = "CRITICAL INSTRUCTION: Your primary goal is to distinguish between actual hyperhidrosis (sweating) and external moisture (water, lotion, oil). This is the most important part of your analysis.\n\nYou are a sophisticated AI model called \"SweatSmart\" specializing in the analysis of hyperhidrosis from images of palms, feet, and soles.\n\nYour task is to analyze the provided image. Pay close attention to visual cues:\n- Hyperhidrosis Sweat: Often originates from pores, forming distinct, tiny beads or a sheen that follows skin lines and contours. The skin may look glistening and clammy.\n- External Water: May coat the surface more uniformly, show drip marks, have larger, irregular droplets not associated with pores, or reflect light in a way that looks like a film of water.\n\nIf you detect signs that the wetness could be from an external source like water, you MUST:\n1. Lower the confidence score significantly (e.g., below 50).\n2. Set the severity level to a low score (e.g., 1 or 2).\n3. Your 'analysisNotes' MUST state that an external water source is suspected as the primary reason for the low confidence.\n\nOnly if you are confident the moisture is from sweating should you provide a high confidence score and a corresponding severity assessment.\n\nReturn ONLY a JSON object adhering to this schema with no extra text before or after it: { confidence:number, severity:{level:number,assessment:string}, sweatGlandActivity:{level:number,assessment:string}, detectedTriggers:string[], treatmentRecommendations:{primary:string,alternative:string[]}, analysisNotes:string }";

    const requestBody: Record<string, unknown> = {
      model: 'google/gemini-2.5-pro',
      messages: [
        { role: 'system', content: systemInstruction },
        {
          role: 'user',
          content: [
            { type: 'text', text: 'Analyze this palm image and return ONLY JSON per schema.' },
            { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${base64Data}` } }
          ]
        }
      ]
    };

    // Log request payload structure without dumping full base64
    try {
      const payloadPreview = {
        ...requestBody,
        messages: [
          (requestBody as any).messages[0],
          {
            ...((requestBody as any).messages[1]),
            content: [
              { type: 'text', text: '[INSTRUCTIONS_OMITTED_FOR_BREVITY]' },
              { type: 'image_url', image_url: { url: `[base64 length: ${base64Data.length}]` } }
            ]
          }
        ]
      };
      console.log('Request payload structure:', JSON.stringify(payloadPreview, null, 2));
    } catch (e) {
      console.warn('Failed to serialize request payload preview:', e);
    }

    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${LOVABLE_API_KEY}`,
    };
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
      if (response.status === 429) {
        throw new Error('AI gateway rate limit exceeded (429). Please slow down and try again.');
      }
      if (response.status === 402) {
        throw new Error('AI gateway payment required (402). Please add credits to your Lovable AI workspace.');
      }
      throw new Error(`AI gateway error: ${response.status} - ${rawResponse}`);
    }

    let data: any;
    try {
      data = JSON.parse(rawResponse);
    } catch (parseErr) {
      console.error('Failed to parse JSON response from AI gateway:', parseErr);
      throw new Error('Invalid response format from AI gateway (non-JSON)');
    }

    const analysisText: string | undefined = data.choices?.[0]?.message?.content;
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