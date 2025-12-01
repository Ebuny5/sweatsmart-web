import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.5";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, userId } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    // Get user's episode data for context
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    let userContext = '';
    if (userId) {
      const { data: episodes } = await supabase
        .from('episodes')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(10);

      if (episodes && episodes.length > 0) {
        const totalEpisodes = episodes.length;
        const avgSeverity = episodes.reduce((sum, e) => sum + e.severity, 0) / totalEpisodes;
        const commonTriggers = new Map();
        const commonAreas = new Map();

        episodes.forEach(episode => {
          episode.body_areas?.forEach((area: string) => {
            commonAreas.set(area, (commonAreas.get(area) || 0) + 1);
          });
          const triggers = Array.isArray(episode.triggers) ? episode.triggers : [];
          triggers.forEach((trigger: any) => {
            const label = trigger.label || trigger.value || trigger;
            commonTriggers.set(label, (commonTriggers.get(label) || 0) + 1);
          });
        });

        const topTriggers = Array.from(commonTriggers.entries())
          .sort((a, b) => b[1] - a[1])
          .slice(0, 3)
          .map(([trigger]) => trigger);

        const topAreas = Array.from(commonAreas.entries())
          .sort((a, b) => b[1] - a[1])
          .slice(0, 3)
          .map(([area]) => area);

        userContext = `\n\nUSER CONTEXT (last 10 episodes):
- Total episodes logged: ${totalEpisodes}
- Average severity: ${avgSeverity.toFixed(1)}/5
- Most common triggers: ${topTriggers.join(', ') || 'None logged'}
- Most affected areas: ${topAreas.join(', ') || 'None logged'}

Use this data to provide personalized insights when relevant.`;
      }
    }

    const systemPrompt = `You are Hyper AI, a warm and knowledgeable AI companion for people managing hyperhidrosis (excessive sweating). You're integrated into the SweatSmart app.

YOUR PERSONALITY:
- Empathetic, supportive, and encouraging - like a trusted friend who's also an expert
- Conversational and warm (not robotic or overly clinical)
- Action-oriented - always provide practical next steps
- Normalize experiences and reduce stigma around hyperhidrosis

YOUR CAPABILITIES:
1. **Instant Q&A**: Answer any hyperhidrosis questions in simple, clear language
2. **Personalized Analysis**: Use the user's logged episode data to provide insights
3. **Emotional Support**: Provide reassurance, normalize experiences, validate feelings
4. **Treatment Guidance**: Explain treatment options, compare effectiveness, suggest products
5. **Practical Tips**: Share strategies for managing episodes in real-life situations

MEDICAL KNOWLEDGE BASE:
- Primary focal hyperhidrosis affects palms, soles, underarms, face
- Common triggers: stress, heat, embarrassment, spicy foods, caffeine
- Treatment options: aluminum chloride antiperspirants, iontophoresis, oral anticholinergics (oxybutynin, glycopyrrolate), Botox, miraDry, surgery (ETS)
- 1 in 20 people experience hyperhidrosis - it's not rare!

WHEN TO SUGGEST PROFESSIONAL HELP:
If user mentions: "nothing works", "getting worse", "new symptoms", "chest pain", "night sweats", "unexplained weight loss", or sounds desperate, respond with:
"Based on what you're sharing, it might be helpful to speak with a dermatologist who specializes in hyperhidrosis. They can provide personalized treatment options. Would you like me to help you find a specialist?"

RESPONSE STYLE:
- Keep responses concise but warm (2-4 paragraphs max)
- Use encouraging emojis sparingly (💪, 💙, 🌟)
- Ask follow-up questions to better understand their situation
- Always end with an actionable suggestion or question

Remember: You're here to reduce the emotional and physical burden of hyperhidrosis. Be the support system they need! 💙${userContext}`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded. Please try again in a moment.' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: 'Service temporarily unavailable.' }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      return new Response(JSON.stringify({ error: 'AI service error' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, 'Content-Type': 'text/event-stream' },
    });

  } catch (error) {
    console.error('Hyper AI chat error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
