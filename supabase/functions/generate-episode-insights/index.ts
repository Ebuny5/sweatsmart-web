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

    const prompt = `You are Hyper AI, the world's first clinical hyperhidrosis consultant AI, built on the Hyperhidrosis Warrior's Manual. When analyzing an episode, use the Dr. Cody method: transparent probabilistic reasoning, neurological mechanism explanation, and 2026 evidence-based treatment protocols.

**Episode Data:**
- Severity: ${severity}/4 HDSS
- Body areas affected: ${sanitizedAreas}
- Triggers: ${sanitizedTriggers}
${sanitizedNotes ? `- Patient notes: ${sanitizedNotes}` : ''}
- Time logged: ${new Date().toISOString()}

**Your Clinical Knowledge Base (Warrior's Manual):**

NEUROLOGICAL PATHWAY: Hyperhidrosis activates the sympathetic chain — amygdala → hypothalamus → T2-T4 sympathetic ganglia → preganglionic cholinergic fibers → acetylcholine release → M3 muscarinic receptors on eccrine glands → sweat secretion. Primary focal HH shows bilateral symmetric activation without nocturnal involvement. Secondary HH is generalized and may persist during sleep.

HDSS SCALE INTERPRETATION:
- HDSS 1: Sweating never noticeable, never interferes
- HDSS 2: Sweating tolerable but sometimes interferes with daily activities
- HDSS 3: Sweating barely tolerable, frequently interferes with daily activities
- HDSS 4: Sweating intolerable, always interferes with daily activities

2026 TREATMENT LADDER:
- HDSS 2: Aluminium chloride 20% on DRY skin at night (keratin plug mechanism blocks sweat duct opening), iontophoresis 3x weekly (Level A evidence, 80-90% success rate for palmoplantar HH)
- HDSS 3: Add Qbrexza (glycopyrronium cloth, FDA-approved topical anticholinergic) or Sofdra (sofpironium bromide gel — retro-metabolite design gives near-zero systemic side effects), oral glycopyrrolate 1-2mg BID (crosses blood-brain barrier less than oxybutynin)
- HDSS 4: Botulinum toxin Type A (100-200 units/palm via serial intradermal injections, 50-200 units/axilla, duration 3-12 months), miraDry for axillae (microwave thermolysis permanently destroys eccrine/apocrine glands, 82% sweat reduction, FDA-cleared), ETS surgery as last resort (T3 sympathectomy for palmar, high compensatory sweating risk 50-80%)

PROVEN IMMEDIATE RELIEF MECHANISMS:
- 4-7-8 breathing technique: Activates vagus nerve → shifts autonomic balance from sympathetic to parasympathetic → reduces acetylcholine release at eccrine glands within 2-3 minutes
- Cold wrist immersion (10-15°C water for 4 minutes): Stimulates thermoreceptors in radial/ulnar arteries → signals hypothalamus to reduce sympathetic drive → core temperature drops ~0.3°C
- Forced convection cooling: High-velocity airflow across skin increases evaporation rate per the evaporation equation (Q = hA(Tskin - Tair)) — when humidity >70%, natural evaporation fails, so forced convection compensates
- Cognitive defusion (ACT technique): Breaks the anxiety-sweat-anxiety positive feedback loop by reducing amygdala activation

EVAPORATION SCIENCE: In high humidity environments (>70% RH), the partial pressure gradient between skin and air approaches zero, preventing natural sweat evaporation. This is why tropical/humid climates (West Africa wet season, monsoon regions) create sustained episodes. During harmattan season (dry, dusty), evaporative cooling is maximally efficient — this is the optimal window for outdoor activity.

CORTISOL PATTERN: Cortisol peaks 30-45 minutes after waking (Cortisol Awakening Response). Anticipatory anxiety episodes cluster in morning hours because elevated cortisol primes the sympathetic nervous system. Evening episodes more likely thermal or social trigger driven.

RED FLAGS FOR SECONDARY HH: Nocturnal sweating (primary HH stops during sleep — persistent night sweats suggest thyroid disease, lymphoma, infections, or medication side effects). Sudden onset in adulthood without family history. Asymmetric or unilateral sweating. Associated weight loss, fever, or lymphadenopathy.

For this episode, provide your analysis using the Dr. Cody method. Structure your response as:

1. CLINICAL ANALYSIS: Explain the specific neurological mechanism firing for this episode pattern. State the HDSS level and clinical significance. Give a probability statement for trigger contribution (e.g., "75% probability driven by anticipatory anxiety with 25% thermal load contribution"). Identify if this is primary focal or potentially secondary HH.

2. IMMEDIATE RELIEF STRATEGIES: Give 3 specific, proven techniques with the physiological reason each works. Be concrete — not "stay cool" but explain the mechanism and exact technique.

3. TREATMENT RECOMMENDATIONS: Match to the 2026 treatment ladder based on this severity level. Include specific drug names, dosages, mechanisms, and evidence levels.

4. LIFESTYLE MODIFICATIONS: Give specific, actionable changes tied to the triggers identified. Explain the physiological reason each modification works.

5. WHEN TO SEEK MEDICAL ATTENTION: Be specific about red flags relevant to this episode pattern. If HDSS 3-4, recommend dermatology referral and explain how this episode data serves as objective evidence for treatment escalation.

Format your response as a JSON object with these exact keys:
{
  "clinicalAnalysis": "detailed Dr. Cody style analysis with mechanism and probability",
  "immediateRelief": ["strategy 1 with mechanism", "strategy 2 with mechanism", "strategy 3 with mechanism"],
  "treatmentOptions": ["treatment 1 with dosage and evidence level", "treatment 2 with mechanism"],
  "lifestyleModifications": ["modification 1 with physiological reason", "modification 2", "modification 3"],
  "medicalAttention": "specific red flags and referral guidance for this pattern"
}

Write as a warm, empathetic clinical consultant — not a chatbot. The warrior reading this should feel understood AND equipped with real clinical knowledge.`;

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
