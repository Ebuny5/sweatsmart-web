import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const API_KEY = Deno.env.get('GOOGLE_AI_STUDIO_API_KEY');

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { severity, bodyAreas, triggers, notes } = await req.json();

    console.log('Generating insights for episode:', { severity, bodyAreas, triggers, notes });

    if (!API_KEY) {
      throw new Error('GOOGLE_AI_STUDIO_API_KEY is not configured');
    }

    // Build a detailed prompt with hyperhidrosis medical knowledge
    const triggersList = triggers.map((t: any) => `${t.label || t.value} (${t.type})`).join(', ');
    const areasAffected = bodyAreas.join(', ');

    const prompt = `You are a specialized medical AI assistant with deep knowledge of hyperhidrosis (excessive sweating). A patient has logged a sweating episode with the following details:

**Episode Details:**
- Severity: ${severity}/5
- Body areas affected: ${areasAffected}
- Triggers: ${triggersList}
${notes ? `- Patient notes: ${notes}` : ''}

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
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: prompt }]
          }],
          generationConfig: {
            temperature: 0.4,
            topK: 32,
            topP: 0.95,
            maxOutputTokens: 2048,
          }
        })
      }
    );

    if (!response.ok) {
      console.error('AI service error:', response.status);
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
