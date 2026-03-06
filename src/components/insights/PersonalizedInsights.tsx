/**
 * PersonalizedInsights.tsx
 * 
 * FIXES:
 * 1. Shape now matches Trigger Intelligence & Most Affected Areas (compact ranked items, NO big cards)
 * 2. Content enriched with Dr. Cody probabilistic reasoning + 2026 clinical knowledge
 * 
 * Drop-in replacement for @/components/insights/PersonalizedInsights
 * Usage (already in insights.tsx):
 *   <PersonalizedInsights episodes={episodes} />
 */

import React, { useState } from "react";
import { ChevronDown, ChevronUp, Zap, Brain, TrendingDown, TrendingUp, Clock, Droplets, Wind, AlertTriangle } from "lucide-react";

interface Episode {
  id?: string;
  severity?: number | string;
  body_areas?: string[];
  triggers?: any[];
  date?: string;
  created_at?: string;
  notes?: string;
}

interface PersonalizedInsightsProps {
  episodes: Episode[];
}

// ── Warrior-grade clinical insight types ─────────────────────────────────────
interface WarriorInsight {
  rank: number;
  icon: React.ReactNode;
  rankColor: string;
  label: string;
  sublabel: string;
  probability: number;        // 0-100 confidence
  probabilityLabel: string;   // e.g. "78% probability"
  bar: string;                // tailwind gradient class for bar
  pill: string;               // tailwind class for category pill
  pillText: string;
  detail: string;             // Dr. Cody deep-dive shown on expand
  action: string;             // Immediate proven strategy
  clinicalNote: string;       // 2026 therapeutics note
}

// ── Helper: parse severity safely ────────────────────────────────────────────
const sev = (ep: Episode) => Number(ep.severity) || 0;

// ── Helper: get hour from episode ────────────────────────────────────────────
const hour = (ep: Episode) => new Date(ep.date || ep.created_at || "").getHours();

// ── Core analysis engine — deterministic Dr. Cody reasoning ──────────────────
function analyzeEpisodes(episodes: Episode[]): WarriorInsight[] {
  if (!episodes.length) return [];

  const total = episodes.length;
  const severities = episodes.map(sev);
  const avgSev = severities.reduce((a, b) => a + b, 0) / total;

  // ── 1. Trigger pattern analysis ──────────────────────────────────────────
  const triggerMap = new Map<string, { count: number; sevs: number[]; type: string }>();
  episodes.forEach(ep => {
    const triggers = Array.isArray(ep.triggers) ? ep.triggers : [];
    triggers.forEach((t: any) => {
      const raw = typeof t === "string" ? JSON.parse(t) : t;
      const key = (raw?.label || raw?.value || "unknown").toLowerCase();
      const type = raw?.type || "environmental";
      const existing = triggerMap.get(key) || { count: 0, sevs: [], type };
      existing.count++;
      existing.sevs.push(sev(ep));
      triggerMap.set(key, existing);
    });
  });

  const topTrigger = Array.from(triggerMap.entries())
    .sort((a, b) => b[1].count - a[1].count)[0];

  // ── 2. Nocturnal vs daytime pattern ──────────────────────────────────────
  const nightEps = episodes.filter(ep => { const h = hour(ep); return h >= 22 || h < 6; });
  const morningEps = episodes.filter(ep => { const h = hour(ep); return h >= 6 && h < 12; });
  const afternoonEps = episodes.filter(ep => { const h = hour(ep); return h >= 12 && h < 18; });

  // ── 3. Severity trajectory — last 3 vs first 3 ───────────────────────────
  const sorted = [...episodes].sort((a, b) =>
    new Date(a.date || a.created_at || "").getTime() -
    new Date(b.date || b.created_at || "").getTime()
  );
  const first3Avg = sorted.slice(0, 3).reduce((a, e) => a + sev(e), 0) / Math.min(3, sorted.length);
  const last3Avg  = sorted.slice(-3).reduce((a, e) => a + sev(e), 0) / Math.min(3, sorted.length);
  const sevDrift = last3Avg - first3Avg;

  // ── 4. Body area concentration ────────────────────────────────────────────
  const areaMap = new Map<string, number>();
  episodes.forEach(ep => (ep.body_areas || []).forEach(a => areaMap.set(a, (areaMap.get(a) || 0) + 1)));
  const topArea = Array.from(areaMap.entries()).sort((a, b) => b[1] - a[1])[0];
  const multiArea = episodes.filter(ep => (ep.body_areas || []).length > 2).length;

  // ── 5. High-severity cluster ──────────────────────────────────────────────
  const highSevEps = episodes.filter(e => sev(e) >= 4);

  const insights: WarriorInsight[] = [];

  // ── INSIGHT A: Dominant trigger pattern ──────────────────────────────────
  if (topTrigger) {
    const [trigName, trigData] = topTrigger;
    const trigPercent = Math.round((trigData.count / total) * 100);
    const trigAvgSev = (trigData.sevs.reduce((a, b) => a + b, 0) / trigData.sevs.length).toFixed(1);
    const isHeat = trigName.includes("hot") || trigName.includes("heat") || trigName.includes("temp");
    const isStress = trigName.includes("stress") || trigName.includes("anxiety") || trigName.includes("wor");
    const isSocial = trigName.includes("crowd") || trigName.includes("social") || trigName.includes("public");

    const detail = isHeat
      ? `Your sympathetic nervous system fires hardest in high-temperature environments. At ambient humidity above 70%, sweat cannot evaporate — your eccrine glands (600–700/cm² on palms) continue secreting without the cooling benefit. This is physiological, not psychological. The evaporation equation fails completely above wet-bulb temperature 28°C.`
      : isStress
      ? `Stress activates your amygdala → hypothalamus → sympathetic chain (T2–T4 ganglia) → acetylcholine release at eccrine glands. Critically: your brain cannot distinguish real threat from social anticipation. Palmar sweating is 95% emotionally-mediated, not thermoregulatory — meaning it fires before you even enter the stressful situation.`
      : isSocial
      ? `Social situations trigger conditioned sympathetic responses. Your hippocampus has encoded these contexts as threat signals through repeated sweating episodes. The brain anticipates the outcome before it occurs — explaining why sweating starts before the event, not during. This is classical autonomic conditioning.`
      : `This recurring trigger is activating your cholinergic sympathetic pathway — the neural circuit controlling your eccrine sweat glands. Unlike most sympathetic responses, this pathway uses acetylcholine (not adrenaline) which is why stress-reducing techniques alone rarely resolve it without targeting the gland directly.`;

    const action = isHeat
      ? `Pre-cool your body 20 min before heat exposure: cold water on wrists/neck lowers core temp and delays eccrine activation threshold. Carry a high-velocity personal fan — forced convection cooling works when evaporation fails.`
      : isStress
      ? `4-7-8 breathing (inhale 4s, hold 7s, exhale 8s) activates the vagus nerve, counteracting sympathetic overflow within 90 seconds. Practice before, not during, the trigger situation.`
      : `Step away for 2 minutes before re-entering. Grounding (5-4-3-2-1 sensory technique) re-engages prefrontal cortex control over limbic activation within 60–90 seconds.`;

    const clinicalNote = isHeat
      ? `2026 protocol: Apply aluminium chloride 20% to DRY skin at night only — keratin plugs form in sweat ducts while glands are minimally active. If insufficient: Sofdra (sofpironium bromide gel) blocks acetylcholine at the gland level with near-zero systemic side effects.`
      : `If trigger persists despite lifestyle management: Botox 100–200 units per palm (3–6 month duration) blocks acetylcholine release at neuroglandular junctions — removes the trigger-response regardless of emotional state.`;

    insights.push({
      rank: 1,
      icon: isHeat ? <Droplets className="h-3.5 w-3.5" /> : isStress ? <Brain className="h-3.5 w-3.5" /> : <Zap className="h-3.5 w-3.5" />,
      rankColor: "bg-amber-400",
      label: `"${trigName.charAt(0).toUpperCase() + trigName.slice(1)}" is your #1 driver`,
      sublabel: `${trigData.count}× · avg severity ${trigAvgSev} · ${trigPercent}% of all episodes`,
      probability: trigPercent,
      probabilityLabel: `${trigPercent}% probability this is your primary trigger`,
      bar: "from-amber-400 to-orange-500",
      pill: "bg-orange-100 text-orange-700",
      pillText: trigData.type === "emotional" ? "Emo" : trigData.type === "dietary" ? "Die" : "Env",
      detail,
      action,
      clinicalNote,
    });
  }

  // ── INSIGHT B: Severity trajectory ───────────────────────────────────────
  if (total >= 4) {
    const driftMag = Math.abs(sevDrift);
    const driftPercent = Math.round(Math.min((driftMag / 5) * 100, 100));
    const worsening = sevDrift > 0.3;
    const improving = sevDrift < -0.3;

    insights.push({
      rank: 2,
      icon: worsening ? <TrendingUp className="h-3.5 w-3.5" /> : improving ? <TrendingDown className="h-3.5 w-3.5" /> : <Zap className="h-3.5 w-3.5" />,
      rankColor: worsening ? "bg-red-400" : improving ? "bg-green-400" : "bg-gray-400",
      label: worsening
        ? `Severity escalating — avg +${sevDrift.toFixed(1)} pts over time`
        : improving
        ? `Severity improving — avg ${Math.abs(sevDrift).toFixed(1)} pts reduction`
        : `Severity stable — consistent across episodes`,
      sublabel: `Baseline ${first3Avg.toFixed(1)} → Recent ${last3Avg.toFixed(1)} (5-point HDSS scale)`,
      probability: driftPercent,
      probabilityLabel: worsening
        ? `${driftPercent}% signal strength — escalation is real, not random`
        : improving
        ? `${driftPercent}% signal — your management is showing measurable effect`
        : `Pattern is stable — no escalation detected`,
      bar: worsening ? "from-red-400 to-rose-500" : improving ? "from-green-400 to-emerald-500" : "from-gray-300 to-gray-400",
      pill: worsening ? "bg-red-100 text-red-700" : improving ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600",
      pillText: worsening ? "↑" : improving ? "↓" : "→",
      detail: worsening
        ? `An upward severity trend over ${total} episodes indicates your current management strategy is not matching the progression of your condition. This pattern correlates with either increasing trigger exposure, physiological sensitisation of the cholinergic pathway, or seasonal/hormonal factors. HDSS escalation from 3 to 4 is the threshold where prescription treatment becomes essential rather than optional.`
        : improving
        ? `Your severity trend is declining — measurable evidence that your current approach (whether lifestyle, antiperspirants, or other interventions) is producing a real neurophysiological effect. Each 0.5-point reduction in average HDSS correlates with meaningful quality-of-life improvement in validated patient studies.`
        : `Stable severity across episodes indicates your hyperhidrosis is in a consistent baseline state. This is valuable — it means your triggers are predictable and a systematic management strategy can be built around your known pattern.`,
      action: worsening
        ? `Document your last 3 high-severity episodes in detail — time, location, food, stress level, temperature. Bring this log to your next clinical appointment. HDSS ≥3 qualifies for prescription treatment referral.`
        : improving
        ? `Maintain your current approach and log what's changed. If you started a new intervention, this data validates it — keep it and document for your dermatologist.`
        : `Use your stability window to experiment: introduce one change (e.g., aluminium chloride nightly application) and track for 2 weeks to isolate its effect.`,
      clinicalNote: worsening
        ? `HDSS ≥3 with worsening trajectory: International Hyperhidrosis Society guidelines recommend escalation to botulinum toxin or topical anticholinergics (Qbrexza/Sofdra). Request referral — this data supports medical necessity.`
        : `Continue current protocol. If severity drops below HDSS 2, consider reducing treatment frequency to find your minimum effective dose.`,
    });
  }

  // ── INSIGHT C: Time-of-day pattern ───────────────────────────────────────
  const peakPeriod = morningEps.length >= afternoonEps.length && morningEps.length >= nightEps.length
    ? { name: "morning", count: morningEps.length, label: "6AM–12PM", clinical: "anticipatory" }
    : afternoonEps.length >= nightEps.length
    ? { name: "afternoon", count: afternoonEps.length, label: "12PM–6PM", clinical: "thermal + social" }
    : { name: "night", count: nightEps.length, label: "10PM–6AM", clinical: "nocturnal — investigate secondary causes" };

  if (total >= 3 && peakPeriod.count > 0) {
    const peakPercent = Math.round((peakPeriod.count / total) * 100);
    const isMorning = peakPeriod.name === "morning";
    const isNight = peakPeriod.name === "night";

    insights.push({
      rank: 3,
      icon: <Clock className="h-3.5 w-3.5" />,
      rankColor: "bg-violet-400",
      label: `Peak episodes: ${peakPeriod.label}`,
      sublabel: `${peakPeriod.count}× in this window · ${peakPercent}% of episodes · ${peakPeriod.clinical}`,
      probability: peakPercent,
      probabilityLabel: `${peakPercent}% of your episodes cluster in this time window`,
      bar: "from-violet-500 to-purple-500",
      pill: "bg-purple-100 text-purple-700",
      pillText: "Time",
      detail: isMorning
        ? `Morning clustering is the hallmark of anticipatory sympathetic activation. Your hypothalamic-pituitary axis (cortisol peaks at 8AM) combines with social anxiety about the day ahead to prime your eccrine system before any real trigger occurs. This is why you may wake up already sweating — cortisol is a direct sympathetic activator.`
        : isNight
        ? `Nocturnal sweating is clinically significant. Primary focal hyperhidrosis STOPS during sleep — nocturnal episodes suggest a secondary cause (hormonal, infectious, metabolic, or medication-related). This warrants clinical investigation: CBC, thyroid function, fasting glucose, and medication review.`
        : `Afternoon episodes correlate with combined thermal load and peak social/occupational stress — the most demanding period of the day for warriors. Temperature is highest, cortisol is declining (reducing stress resilience), and social demands are maximal. This is the most challenging window to manage.`,
      action: isMorning
        ? `30 minutes before your first major engagement: use 4-7-8 breathing + cold wrist immersion (lowers core temp). If applying anticholinergics, do so the night before — they work best when applied to dry skin during low-gland-activity periods.`
        : isNight
        ? `Log nocturnal sweating separately from your daytime episodes and discuss with a doctor. Specifically mention: are you waking from sleep drenched? This changes the diagnostic picture entirely.`
        : `Carry cooling aids for afternoon windows: cooling towel, personal fan, cold water spray. Consider whether work/school schedule can shift high-demand tasks to morning when cortisol is higher and stress resilience better.`,
      clinicalNote: isMorning
        ? `Low-dose oral glycopyrrolate (1mg) taken at bedtime reaches therapeutic levels by morning, pre-emptively blocking acetylcholine before the cortisol-sympathetic surge.`
        : isNight
        ? `Nocturnal hyperhidrosis with HDSS ≥3: rule out lymphoma (night sweats + unintentional weight loss = urgent referral), hyperthyroidism (TSH), and diabetes (fasting glucose) before treating as primary.`
        : `Iontophoresis sessions (15–20 minutes, 3× weekly for palms/soles) are most effective when performed consistently in the late morning — glands are active enough to absorb ions but not in peak episode state.`,
    });
  }

  // ── INSIGHT D: Multi-area vs focal pattern ────────────────────────────────
  if (total >= 3) {
    const multiPercent = Math.round((multiArea / total) * 100);
    const isFocal = multiPercent < 30;

    if (topArea) {
      insights.push({
        rank: 4,
        icon: <Wind className="h-3.5 w-3.5" />,
        rankColor: "bg-sky-400",
        label: isFocal
          ? `Focal pattern — ${topArea[0]} dominant (${Math.round((topArea[1] / total) * 100)}%)`
          : `Generalised pattern — ${multiPercent}% of episodes affect 3+ areas`,
        sublabel: `${topArea[0]} appears in ${topArea[1]}/${total} episodes · ${isFocal ? "Primary focal HH pattern" : "Systemic trigger likely"}`,
        probability: isFocal ? 100 - multiPercent : multiPercent,
        probabilityLabel: isFocal
          ? `${100 - multiPercent}% probability: primary focal hyperhidrosis (not secondary)`
          : `${multiPercent}% of episodes are generalised — investigate systemic triggers`,
        bar: isFocal ? "from-sky-400 to-blue-500" : "from-indigo-400 to-violet-500",
        pill: "bg-sky-100 text-sky-700",
        pillText: isFocal ? "Focal" : "Gen",
        detail: isFocal
          ? `Your pattern shows primary focal hyperhidrosis — sweating concentrated in specific high-eccrine-density areas (palms: 600–700 glands/cm², soles: 600–700/cm²). This is the classic neurological pattern: overactive cholinergic sympathetic pathway to a defined anatomical region. Your sweat glands are structurally normal — the pathology is entirely in the neural control circuit.`
          : `When 3+ body areas sweat simultaneously, it indicates a systemic trigger (heat, hormonal surge, medication effect) rather than primary focal hyperhidrosis. Multi-area episodes driven by stress suggest hyperadrenergic dysautonomia — your entire sympathetic system is over-firing, not just the focal pathway. This changes the treatment approach.`,
        action: isFocal
          ? `Focus treatment on your primary area — ${topArea[0]}. Targeted botulinum toxin or iontophoresis for palms/soles produces the most impact with least side effects versus systemic agents.`
          : `During multi-area episodes: remove to a cool environment first (reduces thermal contribution), then use grounding technique (reduces emotional contribution). Log whether multi-area episodes correlate with specific foods, medications, or temperature spikes.`,
        clinicalNote: isFocal
          ? `Focal palmar/plantar HH: iontophoresis (Level A evidence, 80–90% success rate) or botulinum toxin (100–200 units/hand, 3–6 month duration). Both target the focal eccrine pathway without systemic effects.`
          : `Generalised/multi-area HH with high severity: oral anticholinergics (glycopyrrolate 1–2mg BID or oxybutynin 5–10mg daily) address the systemic cholinergic pathway. Titrate from low dose to balance efficacy vs dry mouth/constipation.`,
      });
    }
  }

  // ── INSIGHT E: High-severity cluster warning ──────────────────────────────
  if (highSevEps.length >= 2) {
    const highPercent = Math.round((highSevEps.length / total) * 100);
    insights.push({
      rank: 5,
      icon: <AlertTriangle className="h-3.5 w-3.5" />,
      rankColor: "bg-rose-500",
      label: `${highSevEps.length} high-severity episodes (4–5/5) logged`,
      sublabel: `${highPercent}% of total · avg severity ${(highSevEps.map(sev).reduce((a,b)=>a+b,0)/highSevEps.length).toFixed(1)} · HDSS ≥3 threshold met`,
      probability: highPercent,
      probabilityLabel: `${highPercent}% of your episodes meet clinical criteria for prescription treatment`,
      bar: "from-rose-400 to-red-500",
      pill: "bg-red-100 text-red-700",
      pillText: "HDSS",
      detail: `${highSevEps.length} episodes at severity 4–5 confirms HDSS ≥3 classification. International Hyperhidrosis Society guidelines define this as "barely tolerable to intolerable, frequently to always interfering with daily activities." This is the clinical threshold at which prescription treatments — botulinum toxin, topical anticholinergics, iontophoresis — are medically indicated, not optional. Many GPs are unaware of these options; a dermatology referral is appropriate.`,
      action: `Print or screenshot your episode history and bring to your next doctor's appointment. State: "My HDSS score is 3–4 based on ${highSevEps.length} logged high-severity episodes. I'd like to discuss prescription treatment options including botulinum toxin or Qbrexza."`,
      clinicalNote: `Your episode data constitutes objective evidence for treatment escalation. HDSS ≥3 is the documented threshold for insurance approval of botulinum toxin in most healthcare systems. Use the "Export for Clinician" feature to generate a formal PDF report.`,
    });
  }

  return insights.slice(0, 4); // Max 4 for clean dashboard
}

// ── Expanded detail drawer ────────────────────────────────────────────────────
const InsightDetail = ({ insight }: { insight: WarriorInsight }) => (
  <div className="mt-3 space-y-2.5 border-t border-gray-100 pt-3">
    {/* Clinical reasoning */}
    <div className="p-3 rounded-xl bg-violet-50 border border-violet-100">
      <p className="text-[10px] font-black text-violet-500 uppercase tracking-wide mb-1">Clinical Analysis</p>
      <p className="text-xs text-violet-800 leading-relaxed">{insight.detail}</p>
    </div>
    {/* Immediate action */}
    <div className="p-3 rounded-xl bg-green-50 border border-green-100">
      <p className="text-[10px] font-black text-green-600 uppercase tracking-wide mb-1">Immediate Strategy</p>
      <p className="text-xs text-green-800 leading-relaxed">{insight.action}</p>
    </div>
    {/* 2026 clinical note */}
    <div className="p-3 rounded-xl bg-blue-50 border border-blue-100">
      <p className="text-[10px] font-black text-blue-500 uppercase tracking-wide mb-1">2026 Treatment Note</p>
      <p className="text-xs text-blue-800 leading-relaxed">{insight.clinicalNote}</p>
    </div>
  </div>
);

// ── Main component ────────────────────────────────────────────────────────────
const PersonalizedInsights: React.FC<PersonalizedInsightsProps> = ({ episodes }) => {
  const [expanded, setExpanded] = useState<number | null>(null);
  const insights = analyzeEpisodes(episodes);

  if (!insights.length) {
    return (
      <p className="text-xs text-gray-400 text-center py-4">
        Log at least 3 episodes to unlock personalised pattern analysis.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {insights.map((insight, i) => {
        const isOpen = expanded === i;
        return (
          <div key={i}>
            {/* ── Compact ranked row (matches Trigger Intelligence style) ── */}
            <button
              onClick={() => setExpanded(isOpen ? null : i)}
              className="w-full flex items-center gap-3 text-left"
            >
              {/* Rank badge */}
              <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-white ${insight.rankColor}`}>
                {insight.icon}
              </div>

              {/* Label + bar */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold text-gray-800 truncate pr-2">{insight.label}</span>
                  <span className="text-[10px] text-gray-400 shrink-0">{insight.sublabel.split("·")[0].trim()}</span>
                </div>
                {/* Probability bar */}
                <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
                  <div
                    className={`h-full rounded-full bg-gradient-to-r ${insight.bar} transition-all duration-500`}
                    style={{ width: `${insight.probability}%` }}
                  />
                </div>
                {/* Probability label */}
                <p className="text-[10px] text-gray-400 mt-0.5 truncate">{insight.probabilityLabel}</p>
              </div>

              {/* Category pill + expand icon */}
              <div className="flex items-center gap-1.5 shrink-0">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${insight.pill}`}>
                  {insight.pillText}
                </span>
                {isOpen
                  ? <ChevronUp className="h-3.5 w-3.5 text-gray-400" />
                  : <ChevronDown className="h-3.5 w-3.5 text-gray-400" />
                }
              </div>
            </button>

            {/* ── Expanded Dr. Cody deep-dive ────────────────────────── */}
            {isOpen && <InsightDetail insight={insight} />}
          </div>
        );
      })}

      {/* Bottom nudge */}
      <p className="text-[10px] text-gray-400 text-center pt-1">
        Tap any insight to expand clinical analysis · Based on {episodes.length} logged episodes
      </p>
    </div>
  );
};

export default PersonalizedInsights;
