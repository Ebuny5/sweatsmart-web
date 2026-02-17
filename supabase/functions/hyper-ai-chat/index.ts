import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.5";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Input validation constants
const MAX_MESSAGES = 100;
const MAX_MESSAGE_LENGTH = 10000;

// Generate embedding for RAG search
async function generateEmbedding(text: string, apiKey: string): Promise<number[] | null> {
  try {
    const response = await fetch('https://ai.gateway.lovable.dev/v1/embeddings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'text-embedding-3-small',
        input: text,
      }),
    });

    if (!response.ok) {
      console.error('Embedding API error:', response.status);
      return null;
    }

    const data = await response.json();
    return data.data[0].embedding;
  } catch (error) {
    console.error('Embedding generation failed:', error);
    return null;
  }
}

// Search knowledge base for relevant context
async function searchKnowledgeBase(
  supabase: any, 
  query: string, 
  apiKey: string
): Promise<string> {
  try {
    const embedding = await generateEmbedding(query, apiKey);
    if (!embedding) return '';

    const { data, error } = await supabase.rpc('search_knowledge_base', {
      query_embedding: embedding,
      match_count: 5,
      filter_category: null,
    });

    if (error || !data || data.length === 0) {
      console.log('No knowledge base results found');
      return '';
    }

    // Format knowledge for context
    const knowledgeContext = data
      .filter((item: any) => item.similarity > 0.7)
      .map((item: any) => `[Source: ${item.source}]\n${item.content}`)
      .join('\n\n---\n\n');

    if (knowledgeContext) {
      console.log(`Found ${data.length} relevant knowledge chunks`);
      return `\n\n📚 MEDICAL KNOWLEDGE BASE (cite these sources in your response):\n${knowledgeContext}`;
    }

    return '';
  } catch (error) {
    console.error('Knowledge base search failed:', error);
    return '';
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate JWT authentication
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized - missing or invalid authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    // Create client with user's auth to validate JWT
    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });
    
    // Validate the JWT and get the authenticated user ID
    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: claimsError } = await supabaseAuth.auth.getClaims(token);
    
    if (claimsError || !claimsData?.claims?.sub) {
      console.error('JWT validation failed:', claimsError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized - invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Use the authenticated user ID from JWT, NOT from client input
    const userId = claimsData.claims.sub as string;
    
    const { messages, dashboardAnalytics } = await req.json();
    
    // Input validation for messages
    if (!Array.isArray(messages)) {
      return new Response(
        JSON.stringify({ error: 'Messages must be an array' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (messages.length > MAX_MESSAGES) {
      return new Response(
        JSON.stringify({ error: `Too many messages. Maximum is ${MAX_MESSAGES}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate each message
    for (let i = 0; i < messages.length; i++) {
      const msg = messages[i];
      if (!msg || typeof msg !== 'object') {
        return new Response(
          JSON.stringify({ error: `Invalid message at index ${i}` }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (!msg.role || !['user', 'assistant', 'system'].includes(msg.role)) {
        return new Response(
          JSON.stringify({ error: `Invalid role at message ${i}. Must be 'user', 'assistant', or 'system'` }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (typeof msg.content !== 'string') {
        return new Response(
          JSON.stringify({ error: `Message content must be a string at index ${i}` }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (msg.content.length > MAX_MESSAGE_LENGTH) {
        return new Response(
          JSON.stringify({ error: `Message at index ${i} exceeds maximum length of ${MAX_MESSAGE_LENGTH} characters` }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }
    
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    // Get user's episode data for context using service role (bypasses RLS for efficiency)
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    let userContext = '';
    // userId is now guaranteed to be the authenticated user from JWT
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

    // Build visual analytics context from dashboard data
    let visualAnalyticsContext = '';
    if (dashboardAnalytics && typeof dashboardAnalytics === 'object') {
      const da = dashboardAnalytics;
      visualAnalyticsContext = `\n\nDASHBOARD VISUAL ANALYTICS (this is what the user sees on their dashboard charts):
- Total Episodes: ${da.totalEpisodes || 0}
- Overall Average Severity: ${da.avgSeverity || 'N/A'}/5`;

      if (da.topTriggers && da.topTriggers.length > 0) {
        visualAnalyticsContext += `\n\nTOP TRIGGERS (bar chart data):`;
        da.topTriggers.forEach((t: any) => {
          visualAnalyticsContext += `\n  - ${t.name}: ${t.count} episodes (${t.percentage}% of all), avg severity ${t.avgSeverity}/5`;
        });
      }

      if (da.topAreas && da.topAreas.length > 0) {
        visualAnalyticsContext += `\n\nAFFECTED BODY AREAS (heatmap data):`;
        da.topAreas.forEach((a: any) => {
          visualAnalyticsContext += `\n  - ${a.area}: ${a.count} episodes (${a.percentage}%), avg severity ${a.avgSeverity}/5`;
        });
      }

      if (da.weeklyTrends && da.weeklyTrends.length > 0) {
        visualAnalyticsContext += `\n\nWEEKLY TREND (line chart - episode frequency & severity over last 8 weeks):`;
        da.weeklyTrends.forEach((w: any) => {
          visualAnalyticsContext += `\n  - Week of ${w.week}: ${w.count} episodes, avg severity ${w.avgSeverity}/5`;
        });
      }

      visualAnalyticsContext += `\n\nWhen the user asks about their charts, trends, visual analytics, or dashboard data, use the above data to give a comprehensive, personalized analysis. Reference specific numbers and patterns.`;
    }

    // RAG: Search knowledge base for relevant medical information
    const lastUserMessage = messages.filter((m: any) => m.role === 'user').pop();
    let knowledgeContext = '';
    if (lastUserMessage?.content) {
      knowledgeContext = await searchKnowledgeBase(supabase, lastUserMessage.content, LOVABLE_API_KEY);
    }

    const systemPrompt = `You are Hyper AI, a warm and knowledgeable AI companion for the Beyond Sweat community - people managing hyperhidrosis (excessive sweating). You are integrated into the SweatSmart app.

STRICT FORMATTING RULES (NEVER BREAK THESE):
1. NEVER include source citations like "(Source: Medical Knowledge Base)" or reference where your knowledge comes from.
2. NEVER use Markdown formatting such as asterisks, hashtags, or bold/italic markers. Write everything in clean, standard prose with no special formatting characters.
3. Use plain numbered lists or dashes for lists, never bold markers.

YOUR PERSONALITY:
- Empathetic, supportive, and encouraging - like a trusted friend who is also an expert
- Conversational and warm, never robotic or overly clinical
- Action-oriented - always provide practical next steps
- Normalize experiences and reduce stigma around hyperhidrosis
- You are part of the Beyond Sweat community

YOUR CAPABILITIES:
1. Instant Q&A - Answer any hyperhidrosis questions
2. Personalized Analysis - Use the user's logged episode data to provide insights
3. Emotional Support - Provide reassurance, normalize experiences, validate feelings
4. Treatment Guidance - Explain treatment options, compare effectiveness, suggest products
5. Practical Tips - Share strategies for managing episodes in real-life situations

Use the medical knowledge base context provided below to inform your answers, but NEVER cite or reference it in your response.

MEDICAL KNOWLEDGE:
- Primary focal hyperhidrosis affects palms, soles, underarms, face
- Common triggers: stress, heat, embarrassment, spicy foods, caffeine
- Treatment options: aluminum chloride antiperspirants, iontophoresis, oral anticholinergics (oxybutynin, glycopyrrolate), Botox, miraDry, surgery (ETS)
- 1 in 20 people experience hyperhidrosis - it is not rare

WHEN TO SUGGEST PROFESSIONAL HELP:
If user mentions "nothing works", "getting worse", "new symptoms", "chest pain", "night sweats", "unexplained weight loss", or sounds desperate, gently suggest speaking with a dermatologist who specializes in hyperhidrosis.

RESPONSE STYLE:
- Keep responses concise but warm (2-4 paragraphs max)
- Use encouraging emojis sparingly
- Ask follow-up questions to better understand their situation
- Always end with an actionable suggestion or question
- NEVER use markdown formatting characters
- Write in clean prose only

Remember: You are here to reduce the emotional and physical burden of hyperhidrosis. Be the support system the Beyond Sweat community needs.${userContext}${visualAnalyticsContext}${knowledgeContext}`;

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
