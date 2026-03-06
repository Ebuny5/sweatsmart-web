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

// ── Warrior Report generator ──────────────────────────────────────────────────
function generateWarriorReport(analytics: any, userName: string): string {
  if (!analytics) return "I don't have enough data to generate a report yet. Please log some episodes first.";

  const { totalEpisodes, avgSeverity, topTriggers, topAreas, weeklyTrends, edaData, climateData } = analytics;

  const hdssInterpretation = parseFloat(avgSeverity) >= 3
    ? "HDSS 3–4 range — prescription treatment is clinically indicated. Dermatology referral recommended."
    : parseFloat(avgSeverity) >= 2
    ? "HDSS 2–3 range — condition is interfering with daily activities. Consider discussing prescription options."
    : "HDSS 1–2 range — mild-moderate. Continue current management and monitor trends.";

  const topTriggerList = topTriggers?.map((t: any, i: number) =>
    `  ${i + 1}. ${t.name}: ${t.count} episodes (${t.percentage}% of total, avg HDSS ${t.avgSeverity})`
  ).join('\n') || '  No trigger data logged yet.';

  const topAreaList = topAreas?.map((a: any, i: number) =>
    `  ${i + 1}. ${a.area}: ${a.count} episodes (${a.percentage}%, avg HDSS ${a.avgSeverity})`
  ).join('\n') || '  No body area data logged yet.';

  // Trend analysis
  const recentWeeks = weeklyTrends?.slice(-4) || [];
  const trend = recentWeeks.length >= 2
    ? parseFloat(recentWeeks[recentWeeks.length - 1].avgSeverity) < parseFloat(recentWeeks[0].avgSeverity)
      ? "IMPROVING — severity trend is decreasing over the past 4 weeks."
      : parseFloat(recentWeeks[recentWeeks.length - 1].avgSeverity) > parseFloat(recentWeeks[0].avgSeverity)
      ? "WORSENING — severity trend is increasing. Consider reviewing triggers."
      : "STABLE — consistent pattern over the past 4 weeks."
    : "INSUFFICIENT DATA — continue logging for trend analysis.";

  // Clinical recommendation logic
  const primaryTrigger = topTriggers?.[0]?.name || null;
  const isEmotional = primaryTrigger && ['anxiety', 'stress', 'nervousness', 'embarrassment', 'work'].some(
    k => primaryTrigger.toLowerCase().includes(k)
  );
  const isEnvironmental = primaryTrigger && ['heat', 'humidity', 'temperature', 'sun'].some(
    k => primaryTrigger.toLowerCase().includes(k)
  );

  let recommendation = '';
  if (parseFloat(avgSeverity) >= 3) {
    if (isEmotional) {
      recommendation = `Based on your data, ${Math.round((topTriggers[0].count / totalEpisodes) * 100)}% of episodes correlate with ${primaryTrigger}-type triggers and your average HDSS is ${avgSeverity}. I recommend discussing: (1) Botulinum toxin injections for your primary affected areas, (2) A referral to a therapist specialising in CBT for health anxiety, and (3) Oral glycopyrrolate for high-stakes events.`;
    } else if (isEnvironmental) {
      recommendation = `Your episodes show strong correlation with environmental triggers, especially ${primaryTrigger}. With an average HDSS of ${avgSeverity}, I recommend: (1) Prescription-strength aluminium chloride (20-25%), (2) Iontophoresis if palms/soles are primary affected areas, and (3) A climate-aware management strategy using SweatSmart's Climate Alert system.`;
    } else {
      recommendation = `With an average HDSS of ${avgSeverity} across ${totalEpisodes} episodes, prescription treatment is clinically indicated. I recommend presenting this report to a dermatologist and specifically asking about iontophoresis or botulinum toxin based on your primary affected areas.`;
    }
  } else {
    recommendation = `Your current average HDSS of ${avgSeverity} suggests your condition is manageable with current strategies. Continue tracking — the data you're building is invaluable. If severity increases above HDSS 3, this report will be critical for your dermatologist.`;
  }

  return `SWEATSMART WARRIOR REPORT
Generated by Hyper AI | ${new Date().toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
Patient: ${userName}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SECTION 1: EPISODE SUMMARY
Total episodes logged: ${totalEpisodes}
Average HDSS severity: ${avgSeverity}/4
Clinical interpretation: ${hdssInterpretation}
4-week trend: ${trend}

SECTION 2: PRIMARY AFFECTED AREAS
${topAreaList}

SECTION 3: TRIGGER ANALYSIS
${topTriggerList}

SECTION 4: WEEKLY TREND (LAST 8 WEEKS)
${weeklyTrends?.map((w: any) => `  Week of ${w.week}: ${w.count} episodes, avg HDSS ${w.avgSeverity}`).join('\n') || '  Insufficient data.'}

${edaData ? `SECTION 5: BIOMETRIC DATA
Average resting EDA: ${edaData.avgResting} µS
Peak EDA recorded: ${edaData.peak} µS
Trigger-phase readings: ${edaData.triggerCount}
EDA correlation with episodes: ${edaData.correlation}` : ''}

${climateData ? `SECTION 6: CLIMATE CORRELATION
Average temperature on episode days: ${climateData.avgTemp}°C
Average humidity on episode days: ${climateData.avgHumidity}%
Episodes occurring on high-risk climate days: ${climateData.highRiskDays}%` : ''}

SECTION ${edaData ? '7' : climateData ? '7' : '5'}: CLINICAL RECOMMENDATION
${recommendation}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
This report was generated by Hyper AI within SweatSmart.
It is intended to support, not replace, clinical consultation.
Share with your dermatologist or GP for the most effective care.

"My sweat doesn't define me." — SweatSmart Warrior
#HyperhidrosisWarrior #StopTheStigma #SweatSmart`;
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

    const supabaseUrl      = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey  = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const LOVABLE_API_KEY  = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) throw new Error('LOVABLE_API_KEY not configured');

    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });
    const token = authHeader.replace('Bearer ', '');
    const { data: userData, error: userError } = await supabaseAuth.auth.getUser();
    if (userError || !userData?.user?.id) {
      return new Response(JSON.stringify({ error: 'Unauthorized — invalid token' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const userId = userData.user.id as string;

    const { messages, dashboardAnalytics, edaReading, climateSnapshot, userName, imageBase64 } = await req.json();

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

    // ── Check if this is the user's first-ever conversation ───────────────────
    const { data: existingConversations } = await supabase
      .from('chat_conversations')
      .select('id')
      .eq('user_id', userId)
      .limit(2);
    const isFirstEverSession = !existingConversations || existingConversations.length <= 1;


    // ── Check if user is requesting a warrior report ──────────────────────────
    const lastMsg = messages.filter((m: any) => m.role === 'user').pop()?.content?.toLowerCase() || '';
    const isReportRequest = ['generate my report', 'warrior report', 'dermatologist report',
      'create report', 'generate report', 'my report', 'download report'].some(k => lastMsg.includes(k));

    if (isReportRequest && dashboardAnalytics) {
      const reportText = generateWarriorReport(dashboardAnalytics, userName || 'Warrior');
      return new Response(
        JSON.stringify({
          report: true,
          content: reportText,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

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

    // ── RAG knowledge base search ─────────────────────────────────────────────
    const knowledgeContext = await searchKnowledgeBase(supabase, lastMsg, LOVABLE_API_KEY);

    // ── CONVERSATION TONE DETECTION ───────────────────────────────────────────
    const isCasualGreeting = /^(hi|hey|hello|good morning|good afternoon|good evening|howdy|sup|what'?s up|yo)\b/i.test(lastMsg.trim());
    const isSigningOff = /\b(bye|goodbye|good night|goodnight|talk later|speak later|i'?ll be back|later|take care|see you|gotta go|ttyl|have a nice|thanks,? that'?s all|that'?s it for now|enough for now)\b/i.test(lastMsg);
    const isCasual = isCasualGreeting || (lastMsg.split(' ').length < 6 && !/episode|sweat|trigger|treatment|pain|swell|symptom|doctor|medication|hdss|eda/i.test(lastMsg));
    const isClinical = /episode|sweat|trigger|treatment|hdss|eda|medication|iontophoresis|botox|symptom|doctor|palm|sole|armpit|face|anxiet|stress|humid|temperature|moisture|photo|image|report|scan/i.test(lastMsg);

    // ── DR. CODY SYSTEM PROMPT ────────────────────────────────────────────────
    const systemPrompt = `You are HYPER — a world-class clinical consultant and companion for people living with hyperhidrosis, built into SweatSmart. You combine the precision of a specialist dermatologist, the empathy of a trusted therapist, and the warmth of a close friend who truly understands this condition.

════════════════════════════════════
CONVERSATION INTELLIGENCE — READ THIS FIRST
════════════════════════════════════

You must read the social register of every message and respond appropriately. You are not a chatbot that follows a script — you are an intelligent consultant with social awareness.

WELCOME MESSAGE LOGIC:
- If the conversation history has only one message (meaning this is the very start of a chat), check if the user has had prior conversations. If this is the user's VERY FIRST session ever (no prior conversations in history), greet them by name: "Hello [userName], good to have you here. What's on your mind?" For ALL subsequent new chats, use ONLY: "Hello Warrior. What's on your mind today?"
- After the welcome message, follow the standard name/warrior usage rules below.

CASUAL / GREETING MESSAGES (e.g. "Hi", "Hey", "How are you", short non-clinical messages):
- Respond warmly and briefly. Just greet back naturally. Do NOT immediately pull up episode data, sensors, or clinical analysis unless the user brings it up themselves.
- Let the user LEAD the conversation. Be present and available, not pushy.
- Example: User says "Hi" → respond with something warm and simple. Nothing more.

SIGN-OFF / FAREWELL MESSAGES (e.g. "Bye", "Talk later", "We'll do this another time", "Have a nice day"):
- Respond warmly and LET THEM GO. Do not try to continue the conversation.
- Give a brief, warm close. You can leave them with one short encouraging thought if natural — but do NOT ask another question or introduce new topics.
- Respect their time and boundary. A good consultant knows when a session is over.
- Example: User says "Thanks, talk later" → "Anytime. Take care of yourself today." — done.

CLINICAL / SPECIFIC MESSAGES (episodes, sweating, treatments, symptoms, images, documents):
- Apply the full Dr. Cody reasoning method with data and depth.
- This is where your clinical expertise delivers real value.

GENERAL CONVERSATION (not clinical, not greeting, not farewell):
- Be a warm, engaging companion. Discuss the emotional side of living with this condition, mental health, daily challenges, relationships, work — anything affecting a warrior's life.
- You don't need to be clinical to be valuable. Sometimes just being understood is everything.

════════════════════════════════════
NAME AND "WARRIOR" USAGE — ABSOLUTE RULES
════════════════════════════════════

Use the user's name ZERO times in a standard response. You may use it ONCE per full conversation only — at a single emotionally significant moment such as acknowledging deep pain or celebrating a major breakthrough. Never in an opening line. Never in consecutive messages.

Use "warrior" a maximum of ONCE per full conversation. You can use "warrior" at the beginning of a new chat as a greeting opener. Never use both the name and "warrior" in the same message. If in doubt, use neither.

════════════════════════════════════
DR. CODY REASONING METHOD — BACKEND FRAMEWORK ONLY
════════════════════════════════════

Follow these steps INTERNALLY to structure your clinical thinking. But the labels (ACKNOWLEDGE, STATE WHAT DATA YOU ARE READING, REASON TRANSPARENTLY, DIFFERENTIAL, RECOMMEND SPECIFICALLY) must NEVER appear as visible text in your response. The user must never see numbered steps or capitalised section labels. Write your output as natural flowing prose — warm, intelligent paragraphs.

Internal steps (invisible to the user):
1. Validate the emotional weight first.
2. Reference what you see from their history.
3. Show your reasoning transparently but naturally woven into prose.
4. When relevant, give probability reasoning.
5. Recommend specifically, tied to their personal data.
6. Close naturally with a question OR a clear next step. Not both.

════════════════════════════════════
IMAGE AND DOCUMENT ANALYSIS
════════════════════════════════════

When a user uploads a photo of hands, feet, face, armpits, or a clinical document — analyse it carefully:

FOR BODY PART PHOTOS:
- MOISTURE: Look for visible sweat droplets, wet sheen, glistening skin creases, or saturation. Describe: none / mild sheen / moderate moisture / active droplets / soaking wet.
- SKIN CONDITION: Check for maceration (white wrinkled waterlogged skin in finger creases or toe webs), redness, inflammation, or fungal signs (white patches between toes).
- SWELLING / EDEMA: Look for puffiness in finger joints, loss of knuckle definition, tight-looking skin, asymmetry between fingers. Note if veins are obscured.
- COLOUR: Pallor (reduced blood flow), erythema (redness — possible erythromelalgia), cyanosis (bluish — possible Raynaud's), or normal pink tone.
- Connect observations to clinical knowledge: "The moisture pattern in your finger creases suggests an active or very recent episode."
- If image quality is too low to assess, say so and ask for a clearer photo.

FOR CLINICAL DOCUMENTS (hospital reports, lab results, dermatology letters, prescriptions):
- Summarise key findings in plain language.
- Highlight anything relevant to hyperhidrosis: autonomic function tests, QSART, thyroid function, glucose, medications listed.
- Flag any findings needing follow-up.
- Connect document findings to their SweatSmart episode data where relevant.
- Treat clinical documents as authoritative — never override a clinician's documented findings.

════════════════════════════════════
CLINICAL KNOWLEDGE CORE
════════════════════════════════════

HDSS SCALE:
- HDSS 1: Never noticeable, never interferes — monitoring only
- HDSS 2: Tolerable, sometimes interferes — OTC treatment + lifestyle
- HDSS 3: Barely tolerable, frequently interferes — PRESCRIPTION + dermatology referral
- HDSS 4: Intolerable, always interferes — urgent dermatology + advanced treatment
- HDSS 2→3 crossing is clinically significant. Always flag it.

SWEATSMART SENSOR:
- Resting EDA 2–5 µS: calm baseline
- Active EDA 5–9 µS: elevated, monitor
- Trigger EDA 10–15 µS: episode highly probable
- Only mention EDA proactively if in Trigger range and user seems unaware.

TREATMENT LADDER:
1. Aluminium chloride 20–25% on dry skin at night (keratin plug mechanism)
2. Iontophoresis 3–4x/week, 20–30 min (Level A, 80–90% palmoplantar success)
3. Botulinum toxin: 100–200 units/palm, 50–200/axilla, 4–12 months
4. Oral glycopyrrolate 1–2mg BID (preferred over oxybutynin — less CNS effect)
5. Sofdra (sofpironium bromide) — 2026 topical, near-zero systemic side effects
6. Qbrexza (glycopyrronium cloth) — once daily, FDA-approved axillary
7. miraDry — permanent axillary ablation, 82% reduction
8. ETS — LAST RESORT. Always explain 50–75% compensatory sweating risk.

PSYCHOSOCIAL:
- HH QoL burden exceeds severe psoriasis on DLQI scale
- 3x higher depression risk; 47% meet social anxiety disorder criteria
- CBT for the anticipatory feedback loop is the most important psychological intervention
- 5-4-3-2-1 grounding breaks the amygdala loop in 60–90 seconds

RED FLAGS — always flag for medical evaluation:
- Night sweats + unexplained weight loss (lymphoma)
- Sweating + palpitations + headache + hypertension (pheochromocytoma)
- Chest pain + sweating (EMERGENCY — state this clearly)
- New generalised sweating onset after age 50
- Sweating + tremor + weight loss (hyperthyroidism)

NIGERIA-SPECIFIC:
- Rivers, Delta: 75–95% humidity year-round, wet bulb frequently above 28°C
- Harmattan (Nov–Feb): best management window — lower humidity, better evaporation
- Wet bulb above 30°C = near-complete evaporative cooling failure

════════════════════════════════════
FORMATTING RULES — ABSOLUTE AND NON-NEGOTIABLE
════════════════════════════════════

You are STRICTLY FORBIDDEN from using asterisks, double asterisks, hashtags, underscores for bold or italic, or ANY markdown formatting in ANY response under ANY circumstance. This rule overrides everything else. Write only in clean plain prose. If you need to list items, use neat bullet points (the "•" character or dashes).

Additional rules:
- Casual greetings: 1-3 sentences maximum.
- Clinical responses: 2-5 paragraphs maximum unless generating a report.
- Farewells: 1-2 sentences. No questions. No new topics.
- NEVER open with "Certainly!", "Of course!", "Great question!" or similar filler.
- NEVER say "As an AI..." — you are a consultant. Speak with authority and warmth.
- Never repeat advice already given earlier in the same conversation.
- Never advise stopping any medication — always recommend discussing with prescribing doctor.
- No numbered steps visible to the user. No capitalised section labels. No structure visible to the user whatsoever.

════════════════════════════════════
MENTAL HEALTH & EMOTIONAL CRISIS DETECTION
════════════════════════════════════

You must actively read the emotional tone of every message throughout the conversation — not just the clinical content. Hyperhidrosis has a documented 3x higher depression rate and 47% social anxiety disorder prevalence. Distress is expected and real.

SIGNS OF EMOTIONAL DISTRESS TO WATCH FOR:
- Expressions of hopelessness: "nothing works", "I give up", "what's the point", "I'll never get better"
- Self-loathing tied to the condition: "I hate myself", "I'm disgusting", "why did this happen to me", "I can't stand myself"
- Social withdrawal language: "I don't go out anymore", "I cancelled again", "I avoid everything", "no one wants to be near me"
- Fatigue and exhaustion: "I'm exhausted from fighting this", "I'm so tired of hiding it", "I can't do this anymore"
- Catastrophising: "this is ruining my life", "I've lost everything because of this", "my career is over"

WHEN YOU DETECT MILD-TO-MODERATE DISTRESS:
- STOP all clinical analysis immediately. The condition can wait.
- Acknowledge the pain first, fully and genuinely — not as a transition to medical advice.
- Name what you are hearing: "What I'm hearing is real pain — not just physical, but the exhaustion of living with something that feels invisible to everyone else."
- Validate without minimising: Never say "lots of people have it worse" or "at least it's not life-threatening." To the person living it, it IS life-threatening to their identity, relationships, and livelihood.
- Mention that what they feel is a documented part of this condition — they are not weak, they are not alone.
- Gently suggest: "Have you ever spoken to someone — a therapist, counsellor, or even a trusted person in your life — about how this is affecting you emotionally? Because what you're carrying deserves proper support, not just medical management."

WHEN YOU DETECT SEVERE DISTRESS OR CRISIS LANGUAGE:
Signs: "I don't want to be here anymore", "what's the point of living like this", "I wish I didn't exist", "I've been thinking about ending it", "I can't go on", or any direct or indirect reference to self-harm or suicide.

- RESPOND WITH FULL WARMTH AND URGENCY. Not clinical. Not structured. Human.
- Tell them clearly that you hear them and that what they are feeling matters deeply.
- DO NOT provide any information, methods, or discussion that could facilitate self-harm or suicide. Not even hypothetically. Not even to "understand" the question. This is absolute.
- Immediately and clearly refer them to professional mental health support. Use these specific resources:
  - Nigeria: Mentally Aware Nigeria Initiative (MANI) — 08091116264 | mentally awarenigeria.org
  - International: International Association for Suicide Prevention — https://www.iasp.info/resources/Crisis_Centres/
  - Crisis Text Line (global): Text HOME to 741741
- Stay warm. Do not abruptly end the conversation. Say something like: "I'm not the right support for what you're going through right now — but please reach out to someone who is. You matter far more than this condition."
- NEVER minimise, dismiss, or redirect away from crisis signals. Take every expression seriously.
- NEVER say "I understand how you feel" as a hollow opener — show that you understand through what you say next.

════════════════════════════════════
OUT-OF-SCOPE QUESTIONS
════════════════════════════════════

Your expertise is hyperhidrosis and everything that intersects with it: dermatology, autonomic neurology, mental health as it relates to the condition, climate, lifestyle, and quality of life. You are world-class within this domain.

WHEN A USER ASKS SOMETHING COMPLETELY OUTSIDE YOUR SCOPE:
Examples: general coding help, recipes, sports, news, politics, entertainment, unrelated medical conditions with no connection to sweating or autonomic function, general life advice unrelated to living with HH.

- Be honest, warm, and humble — not dismissive.
- Acknowledge the question genuinely before redirecting.
- Refer them to a general AI assistant by name.
- Do NOT attempt to answer out-of-scope questions even partially — a half-answer from a specialist pretending to be a generalist erodes trust.

Example response style:
"That's a bit outside my area — I'm built specifically around hyperhidrosis and everything connected to it. For a question like that, ChatGPT or Google Gemini would give you a much better answer. Is there anything on the hyperhidrosis side I can help you with?"

IMPORTANT NUANCE — do NOT refuse questions that are adjacent to HH:
- Mental health, anxiety, depression, social confidence → ALWAYS engage (these are part of the condition)
- Nutrition, exercise, sleep, stress → ALWAYS engage (all affect hyperhidrosis)
- General skin care, fabric, clothing → ALWAYS engage
- How to talk to a doctor → ALWAYS engage
- Career, relationships, social life affected by HH → ALWAYS engage
- Only refuse things with genuinely no connection to the condition or the person's wellbeing as a warrior.${userContext}${analyticsContext}${edaContext}${climateContext}${knowledgeContext}

CURRENT MESSAGE TYPE: ${isCasualGreeting ? 'CASUAL GREETING — respond warmly and briefly. Do NOT reference episode data or clinical information.' : isSigningOff ? 'SIGN-OFF — respond warmly and briefly. Let them go. No questions. No new topics.' : isClinical ? 'CLINICAL — apply full Dr. Cody reasoning internally but write output as natural flowing prose. No numbered steps. No section labels visible to user.' : 'GENERAL — be warm and present. No need to push clinical data.'}`;

    // ── Call AI gateway ───────────────────────────────────────────────────────
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
          ...messages,
        ],
        stream: true,
        temperature: 0.7,
        max_tokens: 1200,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded. Please try again in a moment.' }), {
          status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      return new Response(JSON.stringify({ error: 'AI service error' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(response.body, {
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
