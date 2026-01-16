import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const API_KEY = Deno.env.get('GOOGLE_AI_STUDIO_API_KEY');

// Input validation constants
const MAX_NOTES_LENGTH = 5000;
const MAX_TRIGGERS = 50;
const MAX_BODY_AREAS = 20;
const MIN_SEVERITY = 1;
const MAX_SEVERITY = 10;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { severity, bodyAreas, triggers, notes } = await req.json();

    // Input validation
    if (typeof severity !== 'number' || severity < MIN_SEVERITY || severity > MAX_SEVERITY) {
      return new Response(
        JSON.stringify({ error: `Severity must be between ${MIN_SEVERITY} and ${MAX_SEVERITY}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!Array.isArray(bodyAreas) || bodyAreas.length === 0 || bodyAreas.length > MAX_BODY_AREAS) {
      return new Response(
        JSON.stringify({ error: `Body areas must be an array with 1-${MAX_BODY_AREAS} items` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate each body area is a string
    for (const area of bodyAreas) {
      if (typeof area !== 'string' || area.length > 100) {
        return new Response(
          JSON.stringify({ error: 'Each body area must be a string with max 100 characters' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    if (!Array.isArray(triggers) || triggers.length > MAX_TRIGGERS) {
      return new Response(
        JSON.stringify({ error: `Triggers must be an array with max ${MAX_TRIGGERS} items` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate each trigger
    for (const trigger of triggers) {
      if (typeof trigger !== 'object' || trigger === null) {
        return new Response(
          JSON.stringify({ error: 'Each trigger must be an object' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      const label = trigger.label || trigger.value;
      if (typeof label !== 'string' || label.length > 200) {
        return new Response(
          JSON.stringify({ error: 'Trigger label/value must be a string with max 200 characters' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    if (notes !== undefined && notes !== null) {
      if (typeof notes !== 'string' || notes.length > MAX_NOTES_LENGTH) {
        return new Response(
          JSON.stringify({ error: `Notes must be a string with max ${MAX_NOTES_LENGTH} characters` }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    console.log('Generating insights for episode:', { severity, bodyAreas: bodyAreas.length, triggers: triggers.length });

    if (!API_KEY) {
      throw new Error('GOOGLE_AI_STUDIO_API_KEY is not configured');
    }

    // Build a detailed prompt with hyperhidrosis medical knowledge
    // Sanitize user inputs for prompt (escape special characters and limit length)
    const sanitizedTriggers = triggers
      .slice(0, MAX_TRIGGERS)
      .map((t: any) => {
        const label = String(t.label || t.value || '').slice(0, 200);
        const type = String(t.type || 'unknown').slice(0, 50);
        return `${label} (${type})`;
      })
      .join(', ');
    
    const sanitizedAreas = bodyAreas
      .slice(0, MAX_BODY_AREAS)
      .map((a: string) => String(a).slice(0, 100))
      .join(', ');
    
    const sanitizedNotes = notes ? String(notes).slice(0, MAX_NOTES_LENGTH) : '';

    const prompt = `You are a specialized medical AI assistant with deep knowledge of hyperhidrosis (excessive sweating). A patient has logged a sweating episode with the following details:

**Episode Details:**
- Severity: ${severity}/5
- Body areas affected: ${sanitizedAreas}
- Triggers: ${sanitizedTriggers}
${sanitizedNotes ? `- Patient notes: ${sanitizedNotes}` : ''}

**Your Medical Knowledge Base:**
Hyperhidrosis is a condition characterized by excessive sweating beyond what's needed for thermoregulation. It can be:
- Primary (focal): Affects specific areas like palms, soles, underarms, face
- Secondary (generalized): Caused by underlying conditions or medications

**Treatment Options:**
- Topical: Aluminum chloride solutions (Drysol, Certain Dri), glycopyrrolate cream
- Oral medications: Anticholinergics (oxybutynin, glycopyrrolate)
- Iontophoresis: Low-level electrical current therapy
- Botox injections: Blocks nerve signals to sweat glands (lasts 4-6 months)
- miraDry: Microwave therapy to eliminate sweat glands
- Surgical options: Endoscopic thoracic sympathectomy (ETS) for severe cases

**Common Triggers:**
- Emotional: Stress, anxiety, social situations
- Thermal: Heat, humidity, exercise
- Dietary: Spicy foods, caffeine, alcohol
- Hormonal: Menopause, pregnancy, thyroid disorders

Based on this episode, provide:
1. **Clinical Analysis**: What does this pattern suggest about the type and severity of hyperhidrosis?
2. **Immediate Relief Strategies**: Evidence-based techniques to manage symptoms now (be specific and practical)
3. **Treatment Recommendations**: Appropriate treatment options based on severity and affected areas
4. **Lifestyle Modifications**: Specific, actionable changes to reduce episode frequency
5. **When to Seek Medical Attention**: Clear guidance on when professional intervention is needed

Format your response as a JSON object with these exact keys:
{
  "clinicalAnalysis": "detailed analysis here",
  "immediateRelief": ["strategy 1", "strategy 2", "strategy 3"],
  "treatmentOptions": ["option 1 with explanation", "option 2 with explanation"],
  "lifestyleModifications": ["modification 1", "modification 2", "modification 3"],
  "medicalAttention": "when to see a doctor"
}

Be specific, medical, and evidence-based. Avoid vague advice like "remove yourself if possible." Provide concrete, actionable guidance that a hyperhidrosis patient can actually use.`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: prompt }],
            },
          ],
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gemini API error:', response.status, errorText);
      throw new Error('AI service unavailable');
    }

    const data = await response.json();
    console.log('Gemini response received');

    const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!generatedText) {
      throw new Error('No content generated from Gemini API');
    }

    // Extract JSON from the response (it might be wrapped in markdown code blocks)
    let insights;
    try {
      const jsonMatch = generatedText.match(/```json\n?(.*?)\n?```/s) || generatedText.match(/\{[\s\S]*\}/);
      const jsonText = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : generatedText;
      insights = JSON.parse(jsonText);
    } catch (parseError) {
      console.error('Failed to parse JSON, using raw text:', parseError);
      // Fallback: return the raw text
      insights = {
        clinicalAnalysis: generatedText,
        immediateRelief: ["Review the detailed analysis above"],
        treatmentOptions: ["Consult with a healthcare provider"],
        lifestyleModifications: ["Track patterns in your episodes"],
        medicalAttention: "If symptoms worsen or interfere with daily life"
      };
    }

    return new Response(
      JSON.stringify({ insights }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Insight generation error:', error instanceof Error ? error.message : 'Unknown');
    return new Response(
      JSON.stringify({ error: 'Unable to generate insights. Please try again.' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
