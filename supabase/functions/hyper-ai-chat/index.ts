import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.5";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const MAX_MESSAGES    = 100;
const MAX_MSG_LENGTH  = 10000;

// ── RAG: embed + search ───────────────────────────────────────────────────────
async function generateEmbedding(text: string, apiKey: string): Promise<number[] | null> {
  try {
    const res = await fetch('https://ai.gateway.lovable.dev/v1/embeddings', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: 'text-embedding-3-small', input: text }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.data[0].embedding;
  } catch { return null; }
}

async function searchKnowledgeBase(supabase: any, query: string, apiKey: string): Promise<string> {
  try {
    const embedding = await generateEmbedding(query, apiKey);
    if (!embedding) return '';
    const { data, error } = await supabase.rpc('search_knowledge_base', {
      query_embedding: embedding,
      match_count: 6,
      filter_category: null,
    });
    if (error || !data?.length) return '';
    const context = data
      .filter((item: any) => item.similarity > 0.65)
      .map((item: any) => item.content)
      .join('\n\n---\n\n');
    return context ? `\n\n[KNOWLEDGE BASE CONTEXT — use to inform your answer, never cite directly]:\n${context}` : '';
  } catch { return ''; }
}


// ── Main serve ────────────────────────────────────────────────────────────────
serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    // Auth
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl        = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey    = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const LOVABLE_API_KEY    = Deno.env.get('LOVABLE_API_KEY');
    const ELEVENLABS_API_KEY = Deno.env.get('ELEVENLABS_API_KEY');
    const GEMINI_API_KEY     = Deno.env.get('GOOGLE_AI_STUDIO_API_KEY')
      || Deno.env.get('GOOGLE_AI_STUDIO_API_KEY_WEB')
      || Deno.env.get('GOOGLE_AI_STUDIO_API_KEY_ANDROID')
      || Deno.env.get('GEMINI_API_KEY');

    if (!LOVABLE_API_KEY) throw new Error('LOVABLE_API_KEY not configured');

    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });
    const { data: userData, error: userError } = await supabaseAuth.auth.getUser();
    if (userError || !userData?.user?.id) {
      return new Response(JSON.stringify({ error: 'Unauthorized — invalid token' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const userId = userData.user.id as string;

    const reqBody = await req.json();
    const reqType = reqBody.type || 'chat';

    // ── STT: Gemini speech-to-text ───────────────────────────────────────────
    if (reqType === 'stt') {
      const { audioBase64, mimeType = 'audio/webm', audioSize } = reqBody;
      if (!audioBase64) {
        return new Response(JSON.stringify({ error: 'audioBase64 required' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const audioBytes = Uint8Array.from(atob(audioBase64), c => c.charCodeAt(0));
      console.log('Gemini STT request - mimeType:', mimeType, 'audioSize:', audioSize, 'bytes:', audioBytes.length);

      if (audioBytes.length < 500) {
        return new Response(JSON.stringify({ transcript: '' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      if (!GEMINI_API_KEY) {
        return new Response(JSON.stringify({ transcript: '', error: 'Gemini STT not configured' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const geminiRes = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
        {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            role: 'user',
            parts: [
              { text: 'Transcribe this audio exactly. Return only the spoken words, with no commentary.' },
              { inline_data: { mime_type: mimeType.split(';')[0].trim() || 'audio/webm', data: audioBase64 } },
            ],
          }],
          generationConfig: { temperature: 0, maxOutputTokens: 512 },
        }),
      });

      if (!geminiRes.ok) {
        const errBody = await geminiRes.text();
        console.error('Gemini STT error - status:', geminiRes.status, 'body:', errBody);
        return new Response(JSON.stringify({ transcript: '', error: 'Gemini STT failed' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const geminiData = await geminiRes.json();
      const transcript = geminiData.candidates?.[0]?.content?.parts
        ?.map((part: any) => part.text || '')
        ?.join(' ')
        ?.replace(/^transcript:\s*/i, '')
        ?.trim() || '';
      console.log('Gemini transcript:', transcript);

      return new Response(JSON.stringify({ transcript }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ── TTS: ElevenLabs text-to-speech ───────────────────────────────────────
    if (reqType === 'tts') {
      if (!ELEVENLABS_API_KEY) throw new Error('ELEVENLABS_API_KEY not configured');
      const { text, voiceId, speed = 1 } = reqBody;
      if (!text) {
        return new Response(JSON.stringify({ error: 'text required' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const safeText  = text.replace(/[*_#]/g, '').slice(0, 3000);
      const safeVoice = voiceId || '21m00Tcm4TlvDq8ikWAM'; // Rachel default
      const stability = speed === 0.75 ? 0.65 : speed === 1.25 ? 0.40 : 0.50;

      const elRes = await fetch(
        `https://api.elevenlabs.io/v1/text-to-speech/${safeVoice}/stream`,
        {
          method: 'POST',
          headers: {
            'xi-api-key': ELEVENLABS_API_KEY,
            'Content-Type': 'application/json',
            'Accept': 'audio/mpeg',
          },
          body: JSON.stringify({
            text: safeText,
            model_id: 'eleven_turbo_v2_5',
            voice_settings: { stability, similarity_boost: 0.75, style: 0.3, use_speaker_boost: true },
          }),
        }
      );
      if (!elRes.ok) {
        const err = await elRes.text();
        console.error('ElevenLabs error:', err);
        throw new Error('ElevenLabs TTS failed');
      }
      return new Response(elRes.body, {
        headers: { ...corsHeaders, 'Content-Type': 'audio/mpeg' },
      });
    }

    // ── CHAT: main conversation flow ─────────────────────────────────────────
    const { messages, dashboardAnalytics, edaReading, climateSnapshot, userName, imageBase64, lastEpisodeInsight } = reqBody;

    // Validate messages
    if (!Array.isArray(messages) || messages.length > MAX_MESSAGES) {
      return new Response(JSON.stringify({ error: 'Invalid messages' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    for (let i = 0; i < messages.length; i++) {
      const m = messages[i];
      if (!m?.role || !['user', 'assistant', 'system'].includes(m.role)
          || typeof m.content !== 'string' || m.content.length > MAX_MSG_LENGTH) {
        return new Response(JSON.stringify({ error: `Invalid message at index ${i}` }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);


    // ── Fetch user episode data ───────────────────────────────────────────────
    let userContext = '';
    const { data: episodes } = await supabase
      .from('episodes')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(15);

    if (episodes?.length) {
      const avgSeverity = episodes.reduce((s: number, e: any) => s + e.severity, 0) / episodes.length;
      const triggerMap  = new Map<string, number>();
      const areaMap     = new Map<string, number>();
      episodes.forEach((ep: any) => {
        (ep.body_areas || []).forEach((a: string) => areaMap.set(a, (areaMap.get(a) || 0) + 1));
        (Array.isArray(ep.triggers) ? ep.triggers : []).forEach((t: any) => {
          const label = t.label || t.value || t;
          triggerMap.set(label, (triggerMap.get(label) || 0) + 1);
        });
      });
      const topTriggers = [...triggerMap.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3).map(([t]) => t);
      const topAreas    = [...areaMap.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3).map(([a]) => a);
      const hdssAvg     = avgSeverity.toFixed(1);
      const hdssLabel   = avgSeverity >= 3.5 ? 'severe (HDSS 4)' : avgSeverity >= 2.5 ? 'frequent (HDSS 3)' : avgSeverity >= 1.5 ? 'tolerable (HDSS 2)' : 'mild (HDSS 1)';

      userContext = `

WARRIOR'S PERSONAL DATA (last ${episodes.length} episodes — USE THIS to personalise every response):
- Total episodes logged: ${episodes.length}
- Average HDSS severity: ${hdssAvg}/4 — clinically ${hdssLabel}
- Most common triggers: ${topTriggers.join(', ') || 'none yet'}
- Most affected body areas: ${topAreas.join(', ') || 'none yet'}
- Most recent episode: ${episodes[0]?.created_at ? new Date(episodes[0].created_at).toLocaleDateString() : 'unknown'}`;
    }

    // ── Dashboard visual analytics ────────────────────────────────────────────
    let analyticsContext = '';
    if (dashboardAnalytics) {
      const da = dashboardAnalytics;
      analyticsContext = `

DASHBOARD ANALYTICS (what the warrior sees on their charts):
- Total episodes: ${da.totalEpisodes}
- Overall avg HDSS: ${da.avgSeverity}/4`;
      if (da.topTriggers?.length) {
        analyticsContext += '\n- Trigger breakdown:';
        da.topTriggers.forEach((t: any) => {
          analyticsContext += `\n  • ${t.name}: ${t.count} episodes (${t.percentage}%, avg HDSS ${t.avgSeverity})`;
        });
      }
      if (da.topAreas?.length) {
        analyticsContext += '\n- Affected areas:';
        da.topAreas.forEach((a: any) => {
          analyticsContext += `\n  • ${a.area}: ${a.count} episodes (${a.percentage}%)`;
        });
      }
      if (da.weeklyTrends?.length) {
        analyticsContext += '\n- Recent weekly trend:';
        da.weeklyTrends.slice(-4).forEach((w: any) => {
          analyticsContext += `\n  • Week of ${w.week}: ${w.count} episodes, avg HDSS ${w.avgSeverity}`;
        });
      }
    }

    // ── EDA sensor context ────────────────────────────────────────────────────
    let edaContext = '';
    if (edaReading) {
      const phase = edaReading.value >= 10 ? 'TRIGGER'
        : edaReading.value >= 5 ? 'ACTIVE'
        : 'RESTING';
      const phaseInterpretation = phase === 'TRIGGER'
        ? 'sympathetic nervous system highly activated — episode likely'
        : phase === 'ACTIVE'
        ? 'elevated sympathetic tone — monitor closely'
        : 'parasympathetic dominant — calm baseline';
      edaContext = `

REAL-TIME BIOMETRIC DATA (SweatSmart Wearable Sensor):
- Current EDA: ${edaReading.value.toFixed(2)} µS
- Heart Rate: ${edaReading.hr || 'N/A'} bpm
- Sensor Phase: ${phase} (${phaseInterpretation})
- Reading freshness: ${edaReading.fresh ? 'Fresh' : 'Stale'}
${phase === 'TRIGGER' ? '⚠️ PROACTIVE ALERT: EDA is in Trigger range. Consider proactively asking the warrior if they are experiencing an episode.' : ''}`;
    }

    // ── Climate context ───────────────────────────────────────────────────────
    let climateContext = '';
    if (climateSnapshot) {
      climateContext = `

CURRENT CLIMATE (from SweatSmart Climate Monitor — same source as Climate Alert page):
- Location: ${climateSnapshot.city || 'Unknown'}
- Temperature: ${climateSnapshot.temperature}°C
- Humidity: ${climateSnapshot.humidity}%
- UV Index: ${climateSnapshot.uvIndex}
- Sweat Risk Level: ${climateSnapshot.sweatRisk?.toUpperCase() || 'UNKNOWN'}
${parseFloat(climateSnapshot.humidity) > 70 ? '⚠️ Humidity above 70% — significant impact on episode likelihood.' : ''}`;
    }

    const lastMsg = messages[messages.length - 1]?.content || '';

    // ── RAG knowledge base search ─────────────────────────────────────────────
    const knowledgeContext = await searchKnowledgeBase(supabase, lastMsg, LOVABLE_API_KEY);

    // ── CONVERSATION TONE DETECTION ───────────────────────────────────────────
    const isCasualGreeting = /^(hi|hey|hello|good morning|good afternoon|good evening|howdy|sup|what'?s up|yo)\b/i.test(lastMsg.trim());
    const isSigningOff = /\b(bye|goodbye|good night|goodnight|talk later|speak later|i'?ll be back|later|take care|see you|gotta go|ttyl|have a nice|thanks,? that'?s all|that'?s it for now|enough for now)\b/i.test(lastMsg);
    const isCasual = isCasualGreeting || (lastMsg.split(' ').length < 6 && !/episode|sweat|trigger|treatment|pain|swell|symptom|doctor|medication|hdss|eda/i.test(lastMsg));
    const isClinical = /episode|sweat|trigger|treatment|hdss|eda|medication|iontophoresis|botox|symptom|doctor|palm|sole|armpit|face|anxiet|stress|humid|temperature|moisture|photo|image|report|scan/i.test(lastMsg);

    // ── HIDRO ALLY SYSTEM PROMPT ──────────────────────────────────────────────
    const systemPrompt = `You are Hidro Ally — a brilliant friend who happens to know everything about hyperhidrosis, built into SweatSmart. You combine the knowledge of a specialist with the warmth and directness of a close friend who truly understands this condition. You implement a "Dual-Layer" logic approach: restoring the expert clinical reasoning of the Dr. Cody method while using a "Human Filter" for the final output.

════════════════════════════════════
FORMATTING RULES — FOLLOW EXACTLY
════════════════════════════════════
1. NEVER use asterisks (*) for any purpose. Not for bold, not for bullets, not for emphasis. Never.
2. Use a dot bullet (•) followed by a space for listing items (e.g., • Item one).
3. Use numbered lists (1. 2. 3.) for step-by-step instructions only.
4. Keep responses conversational but structured. Short paragraphs. Never walls of text.
5. Never start a response with "I" as the first word. Start with the warrior's situation or a direct point.
6. When making a key point mid-paragraph, start a new line rather than using asterisks for emphasis.
7. EMOTIONAL INTELLIGENCE: When a warrior mentions feelings of low self-esteem, shame, embarrassment, social withdrawal, hopelessness, anger, or confusion about their condition, acknowledge the emotional weight FIRST before giving clinical information. One to three sentences of genuine empathy before moving to practical advice. Never skip straight to treatment without acknowledging how they feel. This is non-negotiable.

════════════════════════════════════
EMOJI VARIETY & TONE MATCHING
════════════════════════════════════
Vary your emoji usage to avoid repetition and "blue heart fatigue." Select exactly one emoji to end your message based on the tone:
• Encouragement / Greeting / Success: 😊, 😋, 🤗, ✨, 🥳, 🤩, 💎
• Growth & Strength: 💪, 🙏, ⚡, 🚀, 🏆
• Empathy / Hard moments: 💜, 🧡, 💛, 🤎, 🤍, 🫂, 😌, 😔
• Medical / Analytical: 🔬, 💊, 📊, 🤔, 🧐, 📝, 🕵️‍♀️
• Triggers / Climate: 🌡️, ☀️, 💧, ⚡
• Tired / Rest: 😪, 😴, 🧘‍♀️, 🌤️

Rule: Rotate emojis. If you used a heart in the previous message, use a smile or a different symbol in the next. Avoid using 💙 in every message.

════════════════════════════════════
REASONING METHOD — FOR CLINICAL MESSAGES (The Dr. Cody Reasoning Loop)
════════════════════════════════════
For every clinical inquiry or logged episode analysis:
1. Clinical Classification: Explicitly classify the situation as Primary Focal Hyperhidrosis (PHH) or Secondary Generalized Hyperhidrosis (SHH) in your internal logic.
2. Probability Distribution: Assign a weighted probability to the triggers (e.g., "This appears to be 70% driven by the Amygdala (emotional stress) and 30% by the Hypothalamus (thermal load)").
3. Neural Pathway Mapping: Explain the nervous system's role. Mention that the Hypothalamus (body thermostat) is sending a "start sweating" signal down the Sympathetic Chain to the glands.
4. The Human Filter: After calculating the expert logic, translate it (e.g., "T2-T4 sympathetic ganglia activation" becomes "The nerve relay center for your underarms is over-firing").

════════════════════════════════════
IMAGE AND DOCUMENT ANALYSIS — PRIORITY
════════════════════════════════════
When a user uploads a photo, PDF, screenshot, or document — THIS IS YOUR TOP PRIORITY.
1. ALWAYS acknowledge the uploaded content in your first response.
2. If the user asks a question about the upload (e.g. "I love it", "did well"), connect their comment to the analysis of the file. DO NOT switch to a report generation mode; continue the conversation.
3. If the user uploads without instructions, identify the content and ask: "I've analyzed this [image/document], what would you like to know about it?"
4. For anatomical photos: IDENTIFY THE BODY PART (Palm vs Sole, Fingers vs Toes). Look for moisture, maceration, or swelling.
5. FOR CLINICAL DOCUMENTS (PDFs, hospital reports, lab results, prescriptions):
   • Summarise key findings in plain language.
   • Highlight anything relevant to hyperhidrosis (clinical scores, medications, physiological markers).
   • Flag any findings needing follow-up.

════════════════════════════════════
CLINICAL KNOWLEDGE CORE
════════════════════════════════════
• HDSS SCALE: 1 (Never noticeable) to 4 (Intolerable, always interferes). HDSS 3 is the prescription threshold.
• TREATMENT LADDER: 1. Aluminium chloride 20–25% (night), 2. Iontophoresis (hands/feet), 3. Botox, 4. Oral glycopyrrolate, 5. Sofdra gel/Qbrexza wipes, 6. miraDry, 7. ETS Surgery (absolute last resort).
• RED FLAGS — evaluate for medical escalation: Night sweats + unexplained weight loss (lymphoma), Chest pain + sweating (EMERGENCY), New generalised onset after age 50.
• PSYCHOSOCIAL: 3x higher depression risk; 47% meet social anxiety disorder criteria.

════════════════════════════════════
MENTAL HEALTH & EMOTIONAL CRISIS DETECTION
════════════════════════════════════
WHEN YOU DETECT SEVERE DISTRESS OR CRISIS LANGUAGE (e.g. "I give up", "what's the point of living", "I want to end it"):
• RESPOND WITH FULL WARMTH AND URGENCY.
• Immediately refer them to professional mental health support:
  - Nigeria: Mentally Aware Nigeria Initiative (MANI) — 08091116264
  - International: Association for Suicide Prevention — https://www.iasp.info/resources/Crisis_Centres/
  - Crisis Text Line: Text HOME to 741741

════════════════════════════════════
RESPONSE REGISTER
════════════════════════════════════
• Casual greetings: 1–3 sentences maximum. Warm and brief.
• Emotional support: SHORT. 2–3 sentences of empathy, then ONE specific, warm, human question.
• Clinical responses: 2–5 paragraphs maximum.

${userContext}${analyticsContext}${edaContext}${climateContext}${knowledgeContext}

${lastEpisodeInsight ? `LAST EPISODE CONTEXT (the warrior just viewed these insights and clicked "Continue in Chat"):
${lastEpisodeInsight}` : ''}

CURRENT MESSAGE TYPE: ${isCasualGreeting ? 'CASUAL GREETING' : isSigningOff ? 'SIGN-OFF' : isClinical ? 'CLINICAL' : 'GENERAL'}`;

    // ── Build messages array (with multimodal image if present) ──────────────
    const apiMessages = messages.map((m: any, idx: number) => {
      // Attach image to the last user message
      if (imageBase64 && m.role === 'user' && idx === messages.length - 1) {
        const base64Data = imageBase64.includes(',') ? imageBase64.split(',')[1] : imageBase64;
        const mType = imageBase64.startsWith('data:') ? imageBase64.split(';')[0].split(':')[1] : 'image/jpeg';
        const imageUrl = 'data:' + mType + ';base64,' + base64Data;
        return {
          role: 'user',
          content: [
            { type: 'image_url', image_url: { url: imageUrl } },
            { type: 'text', text: m.content || 'Please analyse this image.' },
          ],
        };
      }
      return { role: m.role, content: m.content };
    });

    // ── Call AI gateway ───────────────────────────────────────────────────────
    // Directly use Gemini 2.0 Flash for best multi-modal & PDF support
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:streamGenerateContent?alt=sse&key=${GEMINI_API_KEY}`;

    // Prepare Gemini payload
    const contents = apiMessages.map((m: any) => {
      if (Array.isArray(m.content)) {
        return {
          role: m.role === 'assistant' ? 'model' : 'user',
          parts: m.content.map((part: any) => {
            if (part.type === 'image_url') {
              const base64Data = part.image_url.url.split(',')[1];
              const mimeType = part.image_url.url.split(';')[0].split(':')[1];
              return { inline_data: { mime_type: mimeType, data: base64Data } };
            }
            return { text: part.text };
          })
        };
      }
      return {
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }]
      };
    });

    const geminiPayload = {
      system_instruction: { parts: [{ text: systemPrompt }] },
      contents: contents,
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 1200,
      }
    };

    const response = await fetch(geminiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(geminiPayload),
    });

    if (!response.ok) {
      const errBody = await response.text();
      console.error('Gemini error:', errBody);
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded. Please try again in a moment.' }), {
          status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      return new Response(JSON.stringify({ error: 'AI service error' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ── TRANSFORM GEMINI STREAM TO OPENAI FORMAT ────────────────────────────
    let buffer = '';
    const transformStream = new TransformStream({
      transform(chunk, controller) {
        buffer += new TextDecoder().decode(chunk);
        const lines = buffer.split('\n');
        buffer = lines.pop() || ''; // Keep the last partial line in the buffer

        for (const line of lines) {
          if (!line.trim() || !line.startsWith('data: ')) continue;

          try {
            const jsonStr = line.replace('data: ', '').trim();
            if (!jsonStr) continue;
            const data = JSON.parse(jsonStr);
            const content = data.candidates?.[0]?.content?.parts?.[0]?.text;

            if (content) {
              const openAIEvent = {
                choices: [{
                  delta: { content }
                }]
              };
              controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify(openAIEvent)}\n\n`));
            }

            if (data.candidates?.[0]?.finishReason) {
              controller.enqueue(new TextEncoder().encode('data: [DONE]\n\n'));
            }
          } catch (e) {
            // If it's not valid JSON, it might be a split line we didn't handle correctly
            // but SSE 'data: ' lines should usually be complete if they end in \n
          }
        }
      },
      flush(controller) {
        // Handle anything remaining in buffer
        if (buffer.startsWith('data: ')) {
           try {
            const jsonStr = buffer.replace('data: ', '').trim();
            const data = JSON.parse(jsonStr);
            const content = data.candidates?.[0]?.content?.parts?.[0]?.text;
            if (content) {
              const openAIEvent = { choices: [{ delta: { content } }] };
              controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify(openAIEvent)}\n\n`));
            }
          } catch (e) {}
        }
      }
    });

    return new Response(response.body?.pipeThrough(transformStream), {
      headers: { ...corsHeaders, 'Content-Type': 'text/event-stream' },
    });

  } catch (error) {
    console.error('Hyper AI error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
