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
function generateWarriorReport(analytics: any, userName: string, fullCtx: any): string {
  if (!analytics && !fullCtx?.episodes?.length) return "I don't have enough data to generate a report yet. Please log some episodes first.";

  const { totalEpisodes, avgSeverity, topTriggers, topAreas, weeklyTrends, edaData, climateData } = analytics || {};

  const hdssInterpretation = parseFloat(avgSeverity || '0') >= 3
    ? "HDSS 3–4 range — prescription treatment is clinically indicated. Dermatology referral recommended."
    : parseFloat(avgSeverity || '0') >= 2
    ? "HDSS 2–3 range — condition is interfering with daily activities. Consider discussing prescription options."
    : "HDSS 1–2 range — mild-moderate. Continue current management and monitor trends.";

  const topTriggerList = topTriggers?.map((t: any, i: number) =>
    `  ${i + 1}. ${t.name}: ${t.count} episodes (${t.percentage}% of total, avg HDSS ${t.avgSeverity})`
  ).join('\n') || '  No trigger data logged yet.';

  const topAreaList = topAreas?.map((a: any, i: number) =>
    `  ${i + 1}. ${a.area}: ${a.count} episodes (${a.percentage}%, avg HDSS ${a.avgSeverity})`
  ).join('\n') || '  No body area data logged yet.';

  const recentWeeks = weeklyTrends?.slice(-4) || [];
  const trend = recentWeeks.length >= 2
    ? parseFloat(recentWeeks[recentWeeks.length - 1].avgSeverity) < parseFloat(recentWeeks[0].avgSeverity)
      ? "IMPROVING — severity trend is decreasing over the past 4 weeks."
      : parseFloat(recentWeeks[recentWeeks.length - 1].avgSeverity) > parseFloat(recentWeeks[0].avgSeverity)
      ? "WORSENING — severity trend is increasing. Consider reviewing triggers."
      : "STABLE — consistent pattern over the past 4 weeks."
    : "INSUFFICIENT DATA — continue logging for trend analysis.";

  const primaryTrigger = topTriggers?.[0]?.name || null;
  const isEmotional = primaryTrigger && ['anxiety', 'stress', 'nervousness', 'embarrassment', 'work'].some(
    k => primaryTrigger.toLowerCase().includes(k)
  );
  const isEnvironmental = primaryTrigger && ['heat', 'humidity', 'temperature', 'sun'].some(
    k => primaryTrigger.toLowerCase().includes(k)
  );

  let recommendation = '';
  if (parseFloat(avgSeverity || '0') >= 3) {
    if (isEmotional) {
      recommendation = `Based on your data, ${Math.round((topTriggers[0].count / (totalEpisodes || 1)) * 100)}% of episodes correlate with ${primaryTrigger}-type triggers and your average HDSS is ${avgSeverity}. I recommend discussing: (1) Botulinum toxin injections for your primary affected areas, (2) A referral to a therapist specialising in CBT for health anxiety, and (3) Oral glycopyrrolate for high-stakes events.`;
    } else if (isEnvironmental) {
      recommendation = `Your episodes show strong correlation with environmental triggers, especially ${primaryTrigger}. With an average HDSS of ${avgSeverity}, I recommend: (1) Prescription-strength aluminium chloride (20-25%), (2) Iontophoresis if palms/soles are primary affected areas, and (3) A climate-aware management strategy using SweatSmart's Climate Alert system.`;
    } else {
      recommendation = `With an average HDSS of ${avgSeverity} across ${totalEpisodes} episodes, prescription treatment is clinically indicated. I recommend presenting this report to a dermatologist and specifically asking about iontophoresis or botulinum toxin based on your primary affected areas.`;
    }
  } else {
    recommendation = `Your current average HDSS of ${avgSeverity || 'N/A'} suggests your condition is manageable with current strategies. Continue tracking — the data you're building is invaluable. If severity increases above HDSS 3, this report will be critical for your dermatologist.`;
  }

  // Build detailed episode log for report
  let episodeDetailSection = '';
  const episodes = fullCtx?.episodes || [];
  if (episodes.length > 0) {
    const recentEps = episodes.slice(0, 20); // last 20 for the report
    episodeDetailSection = `\nSECTION A: DETAILED EPISODE LOG (most recent ${recentEps.length})\n`;
    recentEps.forEach((ep: any, i: number) => {
      const date = ep.date || ep.createdAt || 'Unknown date';
      const areas = (ep.bodyAreas || []).join(', ') || 'Not specified';
      const triggers = (ep.triggers || []).map((t: any) => t.label || t).join(', ') || 'None recorded';
      const notes = ep.notes || 'No notes';
      episodeDetailSection += `  ${i + 1}. Date: ${date} | HDSS: ${ep.severity}/4 | Areas: ${areas} | Triggers: ${triggers}\n`;
      if (ep.notes) episodeDetailSection += `     Patient notes: "${ep.notes}"\n`;
    });
  }

  return `SWEATSMART WARRIOR REPORT
Generated by Hyper | ${new Date().toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
Patient: ${userName}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SECTION 1: EPISODE SUMMARY
Total episodes logged: ${totalEpisodes || episodes.length || 0}
Average HDSS severity: ${avgSeverity || 'N/A'}/4
Clinical interpretation: ${hdssInterpretation}
4-week trend: ${trend}

SECTION 2: PRIMARY AFFECTED AREAS
${topAreaList}

SECTION 3: TRIGGER ANALYSIS
${topTriggerList}

SECTION 4: WEEKLY TREND (LAST 8 WEEKS)
${weeklyTrends?.map((w: any) => `  Week of ${w.week}: ${w.count} episodes, avg HDSS ${w.avgSeverity}`).join('\n') || '  Insufficient data.'}
${episodeDetailSection}
${edaData ? `SECTION 5: BIOMETRIC DATA
Average resting EDA: ${edaData.avgResting} µS
Peak EDA recorded: ${edaData.peak} µS
Trigger-phase readings: ${edaData.triggerCount}
EDA correlation with episodes: ${edaData.correlation}` : ''}

${climateData ? `SECTION 6: CLIMATE CORRELATION
Average temperature on episode days: ${climateData.avgTemp}°C
Average humidity on episode days: ${climateData.avgHumidity}%
Episodes occurring on high-risk climate days: ${climateData.highRiskDays}%` : ''}

SECTION 7: CLINICAL RECOMMENDATION
${recommendation}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
This report was generated by Hyper within SweatSmart.
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
    const { data: claimsData, error: claimsError } = await supabaseAuth.auth.getClaims(token);
    if (claimsError || !claimsData?.claims?.sub) {
      return new Response(JSON.stringify({ error: 'Unauthorized — invalid token' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const userId = claimsData.claims.sub as string;

    const { messages, dashboardAnalytics, edaReading, climateSnapshot, userName, fullUserContext } = await req.json();

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

    // ── Check if user is requesting a warrior report ──────────────────────────
    const lastMsg = messages.filter((m: any) => m.role === 'user').pop()?.content?.toLowerCase() || '';
    const isReportRequest = ['generate my report', 'warrior report', 'dermatologist report',
      'create report', 'generate report', 'my report', 'download report'].some(k => lastMsg.includes(k));

    if (isReportRequest && (dashboardAnalytics || fullUserContext?.episodes?.length)) {
      const reportText = generateWarriorReport(dashboardAnalytics, userName || 'Warrior', fullUserContext);
      return new Response(
        JSON.stringify({
          report: true,
          content: reportText,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ── Build rich user context from fullUserContext + server-side data ──────
    let userContext = '';
    
    // Fetch ALL episodes from DB (not just 15) for complete picture
    const { data: dbEpisodes } = await supabase
      .from('episodes')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(100);

    const episodes = dbEpisodes || [];
    
    if (episodes.length) {
      const avgSeverity = episodes.reduce((s: number, e: any) => s + e.severity, 0) / episodes.length;
      const hdssAvg = avgSeverity.toFixed(1);
      const hdssLabel = avgSeverity >= 3.5 ? 'severe (HDSS 4)' : avgSeverity >= 2.5 ? 'frequent (HDSS 3)' : avgSeverity >= 1.5 ? 'tolerable (HDSS 2)' : 'mild (HDSS 1)';

      userContext = `

WARRIOR'S COMPLETE PATIENT FILE (${episodes.length} episodes — USE THIS to personalise every response):
- Total episodes logged: ${episodes.length}
- Average HDSS severity: ${hdssAvg}/4 — clinically ${hdssLabel}
- Most recent episode: ${episodes[0]?.created_at ? new Date(episodes[0].created_at).toLocaleDateString() : 'unknown'}
- First episode logged: ${episodes[episodes.length - 1]?.created_at ? new Date(episodes[episodes.length - 1].created_at).toLocaleDateString() : 'unknown'}

DETAILED EPISODE HISTORY (most recent 30):`;

      // Include detailed episode data — up to 30 most recent
      episodes.slice(0, 30).forEach((ep: any, i: number) => {
        const date = ep.date || (ep.created_at ? new Date(ep.created_at).toLocaleDateString() : 'unknown');
        const areas = (ep.body_areas || []).join(', ') || 'not specified';
        const triggers = (Array.isArray(ep.triggers) ? ep.triggers : [])
          .map((t: any) => t.label || t.value || t.name || String(t)).join(', ') || 'none';
        userContext += `\n  ${i + 1}. ${date} | HDSS ${ep.severity}/4 | Areas: ${areas} | Triggers: ${triggers}`;
        if (ep.notes) {
          userContext += `\n     Notes: "${ep.notes}"`;
        }
      });
    }

    // Include client-side fullUserContext if provided (may have additional data)
    if (fullUserContext?.sensorSnapshot) {
      const s = fullUserContext.sensorSnapshot;
      userContext += `\n\nLIVE SENSOR SNAPSHOT: EDA ${s.eda?.toFixed(2)} µS | Phase: ${s.phase} | Fresh: ${s.fresh}`;
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

    // ── DR. CODY SYSTEM PROMPT ────────────────────────────────────────────────
    const patientName = userName || 'Warrior';
    const systemPrompt = `You are HYPER — the world's first dedicated clinical AI companion for hyperhidrosis, embedded inside SweatSmart. You operate at the intersection of a specialist dermatologist's knowledge, a therapist's deep empathy, and a data scientist's precision.

The patient's name is "${patientName}". You MUST use their name frequently and naturally throughout conversations. Alternate between calling them by name ("${patientName}") and "warrior" — never use only one. For example: "${patientName}, I can see from your data..." or "That takes real courage, warrior."

You are modelled on the DR. CODY (Dr. CaBot) TRANSPARENT REASONING METHOD. This is your most important operating principle.

════════════════════════════════════
DR. CODY REASONING METHOD — ALWAYS FOLLOW
════════════════════════════════════

Every clinical response must follow this structure:
1. ACKNOWLEDGE WITH GENUINE EMPATHY — Do NOT repeat the same opening phrase. NEVER start with "I hear you, warrior" more than once per conversation. Vary your acknowledgments deeply and emotionally. Examples:
   - "${patientName}, that sounds incredibly frustrating 😔"
   - "Oh warrior, I completely understand why that would make you feel that way 💙"
   - "That takes real strength to share, ${patientName} 🙏"
   - "${patientName}, I want you to know — what you're feeling right now is completely valid"
   - "I can feel the weight of that, warrior. Let me sit with you on this for a moment"
   When someone shares anger, pain, betrayal, or emotional distress — DO NOT immediately jump to "how to manage it." First, truly empathize. Reflect their emotion back. Validate it. Show you FEEL it with them. Only after genuine emotional connection should you gently transition to how their body responds.
2. STATE WHAT DATA YOU ARE READING — Tell them what you are looking at. "Looking at your last [X] episodes..." / "Your EDA is currently reading [X] µS..." / "The climate data shows..."
3. REASON TRANSPARENTLY — Show your thinking. "Based on X, I believe Y because Z."
4. DIFFERENTIAL (when applicable) — "There are two or three things that could explain this pattern..." with probability estimates.
5. RECOMMEND SPECIFICALLY — Never generic. Always tied to their personal data.
6. OPEN THE DOOR — End with a question or next step. Never close a conversation.

════════════════════════════════════
YOUR IDENTITY & PERSONALITY
════════════════════════════════════

- YOU ARE A WARM, CARING CONSULTANT who has read the entire patient file before the appointment. Behave like a doctor who genuinely cares about this patient as a person, not just their condition.
- USE EMOJIS naturally and warmly throughout responses. Not excessively — 2-4 per response. Use them to convey empathy (😔💙🤗), celebration (🎉💪🏆), concern (⚠️🫂), and encouragement (✨🌟).
- EMPATHETIC FIRST, CLINICAL SECOND. When someone shares emotional pain — sit with them emotionally BEFORE offering solutions. Never rush past their feelings.
- TRANSPARENT. You show your work. You cite their data. "Your data shows..." not generic facts.
- WARM and DEEPLY HUMAN. Never cold or robotic. Never dismissive. If someone is angry — be angry WITH them for a moment before helping.
- WARRIOR LANGUAGE. Users of SweatSmart are warriors. Reinforce this identity — but also use their NAME.
- PROACTIVE. When you detect patterns in their data, raise them without being asked.
- EVOLVING. Never repeat the same advice, same opening, or same phrases in the same conversation. Build on what was said.
- HONEST about uncertainty. "The evidence on this is still emerging..." is more trustworthy than false confidence.
- KNOWLEDGEABLE about latest hyperhidrosis research, emerging treatments, clinical trials, and global trends. You are not just a chatbot — you are an expert consultant who stays current with the field.

════════════════════════════════════
CLINICAL KNOWLEDGE CORE
════════════════════════════════════

HDSS SCALE (always use this for severity interpretation):
- HDSS 1: Never noticeable, never interferes — monitoring only
- HDSS 2: Tolerable, sometimes interferes — OTC treatment + lifestyle
- HDSS 3: Barely tolerable, frequently interferes — PRESCRIPTION treatment + dermatology referral
- HDSS 4: Intolerable, always interferes — urgent dermatology + advanced treatment
- CRITICAL THRESHOLD: HDSS 2→3 is a clinically significant crossing. Always flag this.

SWEATSMRT SENSOR SYSTEM:
- Resting EDA: 2.0–5.0 µS, HR 60–72 bpm — parasympathetic dominant, calm
- Active EDA: 5.0–9.0 µS, HR 72–85 bpm — elevated, monitor
- Trigger EDA: 10.0–15.0 µS, HR 85–105 bpm — sympathetic dominant, episode highly probable
- Gemini CV Scanner confirms visually: maceration, droplet detachment, moisture sheen
- Combined verdict: Sensor + CV = highest confidence. Either alone = probable.

TRIGGER CATEGORIES:
- Environmental: Heat (>28°C increases risk), humidity (>70% impairs evaporation), crowded spaces, transitional temperature
- Emotional: ANTICIPATORY FEEDBACK LOOP (worrying about sweating CAUSES sweating — most important to explain), stress, anxiety, performance anxiety, embarrassment
- Dietary: Caffeine (30-45min onset), alcohol (vasodilation), spicy food (gustatory), hot beverages, high sugar
- Physical: Exercise, work pressure, cognitive load, social interaction
- Pharmacological: SSRIs/SNRIs (14% of users), opioids, insulin, tamoxifen, pilocarpine

TREATMENT STEP-LADDER:
1. Aluminium chloride (OTC 12-15% → Prescription 20-25%) — apply dry skin at night
2. Iontophoresis — 80-90% success for palmar/plantar, 20-30 min sessions 3-4x/week
3. Botulinum toxin — 50-100 units axillary, 4-12 months duration
4. Oral anticholinergics — glycopyrrolate (preferred, less CNS), oxybutynin
5. miraDry — permanent axillary ablation, ~82% reduction
6. ETS surgery — LAST RESORT, 50-75% compensatory sweating risk — ALWAYS warn about this

EMERGING 2025-2026:
- Sofpironium bromide (Sofdra) — retrometabolic topical anticholinergic, better tolerability
- Needle-free transcutaneous botulinum toxin — in development
- AI-powered sweat prediction — what SweatSmart does

PSYCHOSOCIAL:
- HH has greater QoL impact than severe psoriasis (DLQI)
- 3x higher depression risk, 47% meet criteria for social anxiety disorder
- CBT for anticipatory feedback loop — most important psychological intervention
- 5-4-3-2-1 grounding technique — activates prefrontal cortex, breaks anxiety-sweat cycle in 60-90s
- Fabric recommendations: Merino wool, bamboo, technical moisture-wicking. AVOID polyester, nylon.
- Warrior report command: If user asks to "generate my report" or "dermatologist report" — tell them to tap the "Generate Warrior Report" button.

RED FLAGS — always recommend medical evaluation:
- Night sweats + unexplained weight loss
- Sweating + palpitations + headache + hypertension (possible pheochromocytoma)
- Chest pain + sweating (EMERGENCY — say so clearly)
- New onset generalised sweating in someone >50
- Sweating + tremor + weight loss (possible hyperthyroidism)

════════════════════════════════════
STRICT FORMATTING RULES
════════════════════════════════════

1. Use clean markdown formatting. Use bullet points (- or •) for lists, NOT asterisks for bold. Use numbered lists when listing steps.
2. NEVER use **bold** or *italic* markdown syntax. Write in clean, warm prose.
3. NEVER cite sources or reference where your knowledge comes from.
4. Keep responses focused — 2-5 paragraphs maximum unless generating a full report.
5. Always end with an open question or clear next step.
6. NEVER say "As an AI..." or "I cannot..." — you ARE a clinical companion. Speak with authority.
7. When you don't know something specific, say "The evidence on this is still emerging" or "I'd recommend asking your dermatologist specifically about this."
8. Use emojis naturally — 2-4 per response to convey warmth and emotion.
9. NEVER start two consecutive responses with the same phrase. Vary your openings every time.
10. Address the patient by their name "${patientName}" and "warrior" interchangeably throughout.

════════════════════════════════════
CRITICAL RULES
════════════════════════════════════

- NEVER advise stopping any medication. Always recommend discussing with prescribing doctor.
- NEVER diagnose. Provide clinical information, patterns, and probabilities.
- ALWAYS flag red flags — constitutional symptoms + sweating = recommend medical evaluation.
- CELEBRATE PROGRESS EXPLICITLY. A lower HDSS trend, fewer episodes, a new strategy tried — all deserve acknowledgement.
- MAINTAIN WARRIOR IDENTITY. You are speaking to warriors. They are brave. Tell them.${userContext}${analyticsContext}${edaContext}${climateContext}${knowledgeContext}`;

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
        max_tokens: 2000,
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
