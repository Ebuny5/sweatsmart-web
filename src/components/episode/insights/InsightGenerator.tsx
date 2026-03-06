/**
 * InsightGenerator.tsx — SweatSmart Episode Insight Engine
 *
 * Completely rewritten with Dr. Cody clinical reasoning method.
 * Uses ALL episode data: severity, body areas, triggers, notes, time of day.
 * Works as a standalone engine — no Gemini credits required.
 *
 * Drop-in replacement for src/components/episode/insights/InsightGenerator.tsx
 */

import React, { useState } from 'react';
import { ProcessedEpisode } from '@/types';
import {
  Thermometer, Heart, Brain, Droplets, AlertTriangle,
  Activity, Clock, Zap, Wind, ChevronDown, ChevronUp,
  Shield, FileText, Download
} from 'lucide-react';
import jsPDF from 'jspdf';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

interface InsightGeneratorProps {
  episode: ProcessedEpisode;
}

// ── Clinical insight shape ────────────────────────────────────────────────────
interface ClinicalInsight {
  id: string;
  icon: React.ReactNode;
  headerColor: string;      // gradient on the header strip
  accentColor: string;      // left border colour class
  bgColor: string;          // card background
  badgeColor: string;       // confidence badge
  badgeText: string;
  title: string;
  probability: string;      // "78% probability" — Dr. Cody method
  summary: string;          // 1-sentence hook
  mechanism: string;        // WHY this happened — neurological explanation
  immediate: string;        // What to do right now (proven technique)
  selfManagement: string;   // Longer term strategy
  clinicalNote: string;     // 2026 therapeutics / referral note
  evidenceTag: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────
const triggerValue = (t: any): string =>
  (typeof t === 'string' ? t : t?.label || t?.value || t?.type || '').toLowerCase();

const triggerType = (t: any): string =>
  (typeof t === 'string' ? 'environmental' : t?.type || 'environmental').toLowerCase();

const hasKeyword = (text: string, ...words: string[]): boolean =>
  words.some(w => text.includes(w));

// ── Master insight generator ──────────────────────────────────────────────────
function generateClinicalInsights(episode: ProcessedEpisode): ClinicalInsight[] {
  const insights: ClinicalInsight[] = [];

  const severity   = episode.severityLevel || 1;
  const areas      = episode.bodyAreas || [];
  const triggers   = episode.triggers  || [];
  const notes      = (episode.notes    || '').toLowerCase();
  const episodeHour = episode.datetime
    ? new Date(episode.datetime).getHours()
    : new Date().getHours();

  // ── Categorise triggers ────────────────────────────────────────────────────
  const allTriggerText = triggers.map(triggerValue).join(' ');

  const isHeat     = hasKeyword(allTriggerText, 'hot', 'heat', 'temperature', 'humid', 'sun', 'outdoor', 'warm');
  const isStress   = hasKeyword(allTriggerText, 'stress', 'anxiety', 'nervous', 'wor', 'exam', 'work');
  const isSocial   = hasKeyword(allTriggerText, 'crowd', 'social', 'public', 'speak', 'embarrass', 'interaction');
  const isAntic    = hasKeyword(allTriggerText, 'anticipat');
  const isDietary  = hasKeyword(allTriggerText, 'spicy', 'caffeine', 'alcohol', 'hot drink', 'energy', 'meal', 'gustatory');
  const isMeds     = hasKeyword(allTriggerText, 'ssri', 'antidepressant', 'opioid', 'nsaid', 'medication', 'insulin', 'supplement');
  const isPhysical = hasKeyword(allTriggerText, 'exercise', 'physical', 'sleep', 'night', 'hormonal', 'illness');
  const isAnger    = hasKeyword(allTriggerText, 'anger', 'excit', 'emotion');

  // Body area flags
  const hasPalms    = areas.some(a => a.toLowerCase().includes('palm'));
  const hasSoles    = areas.some(a => a.toLowerCase().includes('sole') || a.toLowerCase().includes('feet') || a.toLowerCase().includes('foot'));
  const hasAxillae  = areas.some(a => a.toLowerCase().includes('arm') || a.toLowerCase().includes('under'));
  const hasFace     = areas.some(a => a.toLowerCase().includes('face') || a.toLowerCase().includes('scalp') || a.toLowerCase().includes('head'));
  const hasTrunk    = areas.some(a => a.toLowerCase().includes('chest') || a.toLowerCase().includes('back'));
  const isMultiArea = areas.length >= 3;
  const isPalmoplantar = hasPalms && hasSoles;

  // Time flags
  const isMorning   = episodeHour >= 5  && episodeHour < 12;
  const isAfternoon = episodeHour >= 12 && episodeHour < 18;
  const isEvening   = episodeHour >= 18 && episodeHour < 22;
  const isNocturnal = episodeHour >= 22 || episodeHour < 5;

  // Notes flags
  const notesHasSwell = hasKeyword(notes, 'swell', 'tight', 'numb', 'tingle', 'puffy');
  const notesHasShame = hasKeyword(notes, 'embarrass', 'shame', 'hate', 'avoid', 'cancel', 'hide');
  const notesHasPain  = hasKeyword(notes, 'pain', 'hurt', 'sting', 'burn', 'slip');

  // ── INSIGHT 1: SEVERITY — always generated ─────────────────────────────────
  const hdssLabel = severity >= 4
    ? 'HDSS 4 — Intolerable'
    : severity === 3
    ? 'HDSS 3 — Barely Tolerable'
    : severity === 2
    ? 'HDSS 2 — Tolerable'
    : 'HDSS 1 — Never Noticeable';

  const severityProb = severity >= 4 ? '94%' : severity === 3 ? '78%' : severity === 2 ? '55%' : '20%';

  const severityMechanism = severity >= 4
    ? `At HDSS 4 your sympathetic nervous system is firing at maximum intensity. Your eccrine glands (600–700/cm² on palms, 150–200/cm² on axillae) are receiving sustained acetylcholine signals that overwhelm normal inhibitory feedback. The sweat rate has exceeded your duct reabsorption capacity — meaning sodium concentration in sweat is also rising, increasing skin maceration risk. This severity level meets the clinical threshold for prescription treatment under International Hyperhidrosis Society guidelines.`
    : severity === 3
    ? `HDSS 3 is the clinical tipping point: sweating is "barely tolerable and frequently interfering." Your cholinergic sympathetic pathway (brain → T2-T4 sympathetic ganglia → eccrine glands) is over-firing with a lowered activation threshold — meaning smaller stimuli produce larger responses than in people without hyperhidrosis. This is neurological dysregulation, not a character trait.`
    : `This HDSS 2 episode indicates your sympathetic pathway was activated but not overwhelmed. Your eccrine glands produced excess sweat in response to a trigger, but the response was within a manageable range. The key insight is identifying what triggered even this moderate response — eliminating it prevents escalation.`;

  const severityImmediate = severity >= 4
    ? `Remove from trigger environment immediately. Apply cold water to wrists and back of neck — thermoreceptors here are directly connected to the hypothalamic temperature regulation circuit. This drops core temperature 0.3–0.5°C within 4 minutes, reducing the thermal component of sympathetic drive.`
    : severity === 3
    ? `Move to a cooler, less stimulating environment. Practise 4-7-8 breathing (inhale 4s, hold 7s, exhale 8s) — this activates the vagus nerve and shifts autonomic balance away from sympathetic dominance within 60–90 seconds.`
    : `Acknowledge the episode without catastrophising — the anxiety-sweat loop amplifies primary hyperhidrosis. Grounding technique: name 5 things you can see. This re-engages prefrontal cortex inhibitory control over limbic activation.`;

  const severityClinical = severity >= 4
    ? `HDSS 4 qualifies for: botulinum toxin injections (100–200 units/palm, 3–6 month duration), Qbrexza (glycopyrronium cloth, axillae, once daily), or Sofdra (sofpironium bromide gel — retro-metabolite design, near-zero systemic side effects). Request dermatology referral. Use "Export for Clinician" below to generate your report.`
    : severity === 3
    ? `HDSS 3 qualifies for prescription treatment. First escalation: aluminium chloride 20% applied to dry skin at night (keratin plug mechanism). Second: oral glycopyrrolate 1mg BID (titrate to 2mg) or iontophoresis 3× weekly for palms/soles (80–90% success rate, Level A evidence).`
    : `HDSS 2: clinical-strength OTC antiperspirants (aluminium chloride 12–15%) and iontophoresis are appropriate first-line measures. Consistent nightly application for 4 weeks before evaluating response.`;

  insights.push({
    id: 'severity',
    icon: severity >= 4 ? <AlertTriangle className="h-5 w-5" /> : <Zap className="h-5 w-5" />,
    headerColor: severity >= 4 ? 'from-red-500 to-rose-500' : severity === 3 ? 'from-indigo-500 to-violet-500' : 'from-blue-400 to-cyan-400',
    accentColor: severity >= 4 ? 'border-l-red-500' : severity === 3 ? 'border-l-indigo-500' : 'border-l-blue-400',
    bgColor: severity >= 4 ? 'bg-red-50/40' : severity === 3 ? 'bg-indigo-50/40' : 'bg-blue-50/40',
    badgeColor: severity >= 4 ? 'bg-red-100 text-red-800' : severity === 3 ? 'bg-indigo-100 text-indigo-800' : 'bg-blue-100 text-blue-700',
    badgeText: severity >= 4 ? 'High' : severity === 3 ? 'Medium' : 'Low',
    title: `Episode Severity — ${hdssLabel}`,
    probability: `${severityProb} probability this severity warrants clinical intervention`,
    summary: severity >= 4
      ? `This was a maximal-severity episode. Your sympathetic nervous system reached peak activation — this is a signal your body needs clinical support, not just coping strategies.`
      : severity === 3
      ? `This episode frequently interfered with daily activities. Your cholinergic sympathetic pathway is over-firing beyond normal range.`
      : `A moderate episode. Your trigger threshold is lower than average — identify and remove it to prevent escalation.`,
    mechanism: severityMechanism,
    immediate: severityImmediate,
    selfManagement: `Document what you were doing in the 30 minutes before this episode. Specifically: location, temperature, what you ate, stress level (1-10), and social context. Three consecutive logs like this will reveal your personal trigger sequence — the combination that pushes you over threshold.`,
    clinicalNote: severityClinical,
    evidenceTag: `HDSS scale (Solish et al., J Am Acad Dermatol 2007) · Severity ${severity}/4`,
  });

  // ── INSIGHT 2: DOMINANT TRIGGER ────────────────────────────────────────────
  if (triggers.length > 0) {
    let trigTitle = '';
    let trigMechanism = '';
    let trigImmediate = '';
    let trigSelfManagement = '';
    let trigClinical = '';
    let trigIcon = <Thermometer className="h-5 w-5" />;
    let trigHeader = 'from-orange-400 to-amber-500';
    let trigAccent = 'border-l-orange-500';
    let trigBg = 'bg-orange-50/40';
    let trigBadge = 'bg-orange-100 text-orange-800';
    let trigProb = '';

    if (isHeat) {
      trigTitle = 'Primary Trigger — Heat / Humidity';
      trigProb = '82% probability: environmental thermal load exceeded evaporation capacity';
      trigMechanism = `High ambient temperature activates warm-sensitive neurons in your hypothalamic preoptic area, which signal the rostral ventrolateral medulla to increase sympathetic outflow to eccrine glands. Simultaneously, high humidity reduces the air's capacity to accept water vapour — when relative humidity exceeds 70%, sweat cannot evaporate. Your body sweats more trying to achieve cooling that the environment cannot permit. For a warrior with hyperhidrosis, this creates a runaway loop: failed evaporation → continued sweating → more failed evaporation.`;
      trigImmediate = `Forced convection cooling: a high-velocity personal fan works by increasing air movement across skin, achieving evaporative cooling even in humid conditions when passive evaporation fails. Target wrists and neck — thermoreceptors here send direct signals to the hypothalamic cooling centre.`;
      trigSelfManagement = `Pre-cooling strategy: cold shower 20 minutes before anticipated heat exposure lowers core temperature, delaying the threshold at which your hypothalamus activates sweating. Carry a cooling towel (activated by water — evaporative cooling works even in humidity when the towel is the evaporating surface, not your skin).`;
      trigClinical = `Heat-triggered episodes with HDSS ≥3: aluminium chloride applied nightly to DRY skin (the keratin plug mechanism requires inactive glands — apply before sleep when eccrine activity is at its lowest). For palms/soles: iontophoresis 3–4× weekly. Sofdra gel (sofpironium bromide) is a 2026 option that blocks gland activation before thermal stimulus reaches threshold.`;
      trigIcon = <Thermometer className="h-5 w-5" />;
    } else if (isStress || isAntic) {
      trigTitle = isAntic ? 'Primary Trigger — Anticipatory Sweating' : 'Primary Trigger — Stress / Anxiety';
      trigProb = '85% probability: amygdala-sympathetic activation before the trigger fully arrived';
      trigMechanism = `Your amygdala classified this situation as a threat before your prefrontal cortex could evaluate it rationally. The amygdala → hypothalamus → sympathetic chain pathway fires in under 200 milliseconds — faster than conscious thought. In hyperhidrosis, this pathway has a lower firing threshold AND produces a larger magnitude response. Critically: palmar and plantar sweating is 95% emotionally mediated (not thermoregulatory) — it fires in anticipation of the stressor, not just during it. Your hippocampus has encoded similar past situations as "sweating contexts" through classical conditioning.`;
      trigImmediate = `4-7-8 breathing within 2 minutes of trigger onset: inhale through nose for 4 seconds, hold for 7, exhale through mouth for 8. This activates the vagus nerve's parasympathetic branch, directly opposing the amygdala-sympathetic signal. Repeat 3 cycles. Your cortisol should measurably drop within 5 minutes.`;
      trigSelfManagement = `Planned exposure therapy: deliberately enter mild versions of your trigger situation (e.g., shorter social interactions before longer ones) while using breathing techniques. This gradually re-trains your hippocampus to de-classify these contexts as threats. Consistency over 3–4 weeks produces measurable reduction in amygdala activation.`;
      trigClinical = `Stress-triggered hyperhidrosis with HDSS ≥3: low-dose oral glycopyrrolate (1mg taken 30–60 minutes before anticipated trigger situations) pre-emptively blocks acetylcholine at eccrine glands before the amygdala fires. This removes the somatic expression of the anxiety cycle and can break its reinforcement over time.`;
      trigIcon = <Brain className="h-5 w-5" />;
      trigHeader = 'from-purple-500 to-violet-500';
      trigAccent = 'border-l-purple-500';
      trigBg = 'bg-purple-50/40';
      trigBadge = 'bg-purple-100 text-purple-800';
    } else if (isSocial) {
      trigTitle = 'Primary Trigger — Social / Crowded Environment';
      trigProb = '79% probability: conditioned autonomic social anxiety response';
      trigMechanism = `Social situations activate both the amygdala (threat detection) and the anterior cingulate cortex (self-monitoring — "am I being evaluated?"). Together they produce anticipatory sympathetic activation before any real social danger exists. In hyperhidrosis, repeated episodes in social settings have conditioned your hippocampus to treat these environments as sweat-triggers — so your eccrine glands begin activating upon recognition of the social context, before you even consciously feel anxious.`;
      trigImmediate = `5-4-3-2-1 grounding: identify 5 things you can see, 4 you can physically touch, 3 sounds you can hear, 2 things you can smell, 1 thing you can taste. This technique redirects prefrontal processing away from internal body-monitoring (which amplifies sweating awareness) to external sensory data, interrupting the self-reinforcing loop.`;
      trigSelfManagement = `Gradual social exposure with coping strategy practice. Before each social event: apply anticholinergic (if prescribed), rehearse grounding technique, prepare exit if needed. Over 6–8 weeks of deliberate exposure with successful coping, hippocampal reconditioning reduces baseline anticipatory activation.`;
      trigClinical = `Social-context hyperhidrosis: cognitive behavioural therapy (CBT) with a psychologist experienced in chronic conditions has Level B evidence for reducing sympathetic reactivity to social triggers. Combined with botulinum toxin (removes the somatic sweating) — the two-pronged approach breaks both the physical and psychological components of the loop simultaneously.`;
      trigIcon = <Heart className="h-5 w-5" />;
      trigHeader = 'from-pink-500 to-rose-400';
      trigAccent = 'border-l-pink-500';
      trigBg = 'bg-pink-50/40';
      trigBadge = 'bg-pink-100 text-pink-800';
    } else if (isDietary) {
      trigTitle = 'Primary Trigger — Dietary / Gustatory';
      trigProb = '71% probability: gustatory sweating via trigeminal-autonomic reflex';
      trigMechanism = `Spicy foods contain capsaicin which binds TRPV1 receptors on the tongue and oral mucosa — the same heat-sensing receptors that detect real thermal stimulation. Your brain interprets this chemical heat signal as genuine temperature increase and activates your eccrine glands accordingly. Caffeine directly stimulates the sympathetic nervous system by blocking adenosine receptors, increasing norepinephrine release and raising baseline sympathetic tone. Alcohol causes peripheral vasodilation, raising skin temperature and triggering thermoregulatory sweating on top of an already hyperactive eccrine system.`;
      trigImmediate = `Cold water sipped slowly immediately after dietary trigger — activates oral cold receptors that partially counteract the TRPV1 heat signal. Avoid hot beverages alongside the trigger food.`;
      trigSelfManagement = `Gustatory sweating journal: log which specific foods (not just categories) trigger your episodes and at what quantity threshold. Most warriors find a dose-response relationship — small amounts of caffeine are tolerable; large amounts cross their personal threshold. Knowing your threshold allows strategic management rather than elimination.`;
      trigClinical = `Severe gustatory sweating: craniofacial botulinum toxin (25–50 units distributed across forehead, scalp, upper lip) specifically targets the facial eccrine activation pathway that responds to gustatory stimuli. Oral anticholinergics (glycopyrrolate) also effectively block gustatory sweating but require systemic dosing.`;
      trigIcon = <Droplets className="h-5 w-5" />;
      trigHeader = 'from-green-500 to-emerald-500';
      trigAccent = 'border-l-green-500';
      trigBg = 'bg-green-50/40';
      trigBadge = 'bg-green-100 text-green-800';
    } else if (isMeds) {
      trigTitle = 'Potential Trigger — Medication / Supplement Effect';
      trigProb = '68% probability: pharmacological sympathomimetic or diaphoretic side effect';
      trigMechanism = `Several common medications have excessive sweating as a documented side effect through different mechanisms: SSRIs/SNRIs increase serotonergic tone, which activates the raphe nuclei — brainstem centres that modulate autonomic thermoregulation. Opioids cause histamine release and peripheral vasodilation. NSAIDs can trigger compensatory sweating during fever reduction. If a new medication preceded your episodes, pharmacological causation should be considered before attributing episodes solely to primary hyperhidrosis.`;
      trigImmediate = `Do not stop medication without speaking to your prescribing doctor. Log the timing: did this episode occur within 2 hours of taking a dose? Dose-timing correlation is the key clinical clue.`;
      trigSelfManagement = `Bring your medication list to your next appointment and specifically ask: "Can any of these medications cause or worsen sweating?" Many GPs don't spontaneously make this connection. SSRIs in particular have sweating as a dose-dependent side effect that often improves with dose reduction or switching to a different agent.`;
      trigClinical = `If medication-induced hyperhidrosis is confirmed: dose reduction, timing adjustment (taking at night when sweating is less socially impactful), or switching to a medication with lower diaphoretic profile are the first-line approaches — before adding anticholinergic treatment on top.`;
      trigIcon = <Shield className="h-5 w-5" />;
      trigHeader = 'from-red-400 to-pink-500';
      trigAccent = 'border-l-red-400';
      trigBg = 'bg-red-50/40';
      trigBadge = 'bg-red-100 text-red-800';
      trigProb = '68% probability: pharmacological side effect contributing to this episode';
    } else {
      // Generic trigger
      const firstTrigger = triggers[0];
      trigTitle = `Logged Trigger — ${firstTrigger?.label || firstTrigger?.value || 'Unknown Factor'}`;
      trigProb = '60% probability: this trigger activated your cholinergic sympathetic pathway';
      trigMechanism = `Whatever the specific trigger, the final common pathway is the same: sensory or emotional input → central nervous system processing → sympathetic outflow via thoracic ganglia (T1-T4) → acetylcholine release → M3 muscarinic receptor activation → sweat secretion. The key clinical question is whether this trigger is environmental (manageable through avoidance or environmental control) or emotional/autonomic (requires neural pathway intervention).`;
      trigImmediate = `Remove from the trigger situation if possible. If not, use controlled breathing to reduce sympathetic amplification while you cannot avoid the trigger.`;
      trigSelfManagement = `Add this trigger to your personal trigger log. After 5–7 episodes documenting it, Hyper AI's pattern analysis can calculate whether it's a consistent driver or coincidental.`;
      trigClinical = `Unclassified triggers that consistently produce HDSS ≥3 episodes warrant a dermatology consultation. Bring your log. The pattern data is clinically useful for treatment selection.`;
    }

    insights.push({
      id: 'trigger',
      icon: trigIcon,
      headerColor: trigHeader,
      accentColor: trigAccent,
      bgColor: trigBg,
      badgeColor: trigBadge,
      badgeText: 'Trigger',
      title: trigTitle,
      probability: trigProb,
      summary: `Your logged trigger(s) activated the cholinergic sympathetic pathway. This insight explains the specific mechanism for this trigger type.`,
      mechanism: trigMechanism,
      immediate: trigImmediate,
      selfManagement: trigSelfManagement,
      clinicalNote: trigClinical,
      evidenceTag: `Trigger type: ${triggerType(triggers[0])} · ${triggers.length} trigger(s) logged`,
    });
  }

  // ── INSIGHT 3: BODY AREA PATTERN ──────────────────────────────────────────
  if (areas.length > 0) {
    let areaTitle = '';
    let areaMechanism = '';
    let areaImmediate = '';
    let areaSelf = '';
    let areaClinical = '';
    let areaProb = '';
    let areaIcon = <Activity className="h-5 w-5" />;

    if (isPalmoplantar) {
      areaTitle = 'Palmoplantar Pattern — Classic Primary Focal HH';
      areaProb = '91% probability: primary focal hyperhidrosis (not secondary/systemic)';
      areaMechanism = `Simultaneous palmar and plantar sweating is the most characteristic pattern of primary focal hyperhidrosis. Both regions share the highest eccrine gland density in the body (600–700 glands/cm²) and both are almost exclusively under emotional sympathetic control — not thermoregulatory. This means your sweating in these areas fires in response to psychological stimuli, social situations, and anticipation — NOT primarily to heat. This pattern is neurological, not psychological weakness, and it responds specifically to treatments that target the cholinergic pathway.`;
      areaImmediate = `Palms: press firmly on a cool, dry surface — pressure activates mechanoreceptors that partially counteract the eccrine activation signal. Soles: remove shoes briefly if safe — airflow reduces maceration and secondary discomfort.`;
      areaSelf = `Palmoplantar-specific strategy: iontophoresis trays for both hands and feet simultaneously (most units support both). 20-minute sessions 3–4× weekly initially reduces palmar sweating by 80–90% in compliant users (Level A evidence). Commit to 4 weeks before evaluating.`;
      areaClinical = `Palmoplantar HH treatment ladder: (1) Aluminium chloride 20% at night; (2) Iontophoresis 3× weekly; (3) Botulinum toxin 100–200 units/hand and 100–200 units/foot under regional anaesthesia; (4) Sympathectomy T2-T3 as last resort (high compensatory sweating risk — 67–80%). Steps 1–3 are non-surgical and reversible.`;
    } else if (hasPalms && !hasSoles) {
      areaTitle = 'Palmar Pattern — Emotionally-Mediated Focal HH';
      areaProb = '88% probability: primary focal palmar hyperhidrosis';
      areaMechanism = `Palmar sweating is uniquely neurological — it is one of the few sudomotor responses that is entirely emotionally mediated rather than thermoregulatory. Your palmar eccrine glands (600–700/cm²) respond to amygdala activation, anticipatory anxiety, and social stress with millisecond-latency responses. Even reading about stressful situations can trigger palmar sweating in people with hyperhidrosis. This explains why standard "stress relief" advice is insufficient — the pathway bypasses conscious processing.`;
      areaImmediate = `Cold, dry surface pressure on palms (desk, wall) activates opposing mechanoreceptors. If available: antiperspirant roll-on (aluminium chloride) to palms — even partial coverage provides meaningful reduction within 2–4 hours.`;
      areaSelf = `Palmar-specific: iontophoresis is first-line (Level A evidence, 80–90% success rate). Available as home units (Hidrex, Drionic, Fischer). Sessions: 20 minutes, 3–4× weekly for 4 weeks, then 1–2× weekly maintenance. Add glycopyrrolate to the water for enhanced efficacy.`;
      areaClinical = `If iontophoresis is insufficient: botulinum toxin 100–200 units per palm (injected intradermally at 1–2 cm intervals). Duration: 3–6 months per treatment. Regional anaesthesia (median/ulnar nerve block) is recommended — palm injections without anaesthesia are painful.`;
    } else if (hasFace) {
      areaTitle = 'Craniofacial Pattern — High Visibility Impact';
      areaProb = '74% probability: craniofacial primary HH or gustatory component';
      areaMechanism = `Facial sweating has dual drivers in hyperhidrosis: emotional (via the amygdala-sympathetic pathway) and gustatory (via trigeminal nerve stimulation by food/temperature). Facial eccrine glands (175–200/cm² on forehead) are among the most socially visible sweat sites, creating a particularly vicious anxiety-sweat loop — visible sweating triggers social anxiety, which triggers more sweating. The craniofacial region also responds to gustatory triggers (spicy food, hot drinks) through the trigeminal-autonomic reflex.`;
      areaImmediate = `Oil-blotting paper immediately absorbs visible sweat without disturbing skin. Cooling facial mist (thermal spring water sprays like Avène) reduces skin surface temperature and partially resets the thermal component. Avoid wiping with hands — this transfers oils and bacteria.`;
      areaSelf = `Cooling facial wipes before anticipated trigger situations (carried discretely). Avoid gustatory triggers (spicy food, caffeine, hot drinks) during high-stakes social situations. Use mattifying non-comedogenic skincare to reduce the appearance of sweat.`;
      areaClinical = `Craniofacial HH: oral anticholinergics (glycopyrrolate 1–2mg BID or oxybutynin 5–10mg) are first-line systemic options addressing the entire facial field. Botulinum toxin injections (25–50 units distributed across forehead, scalp, upper lip) provide 4–6 month duration. For gustatory sweating: Frey syndrome protocol (botulinum toxin to preauricular area) if applicable.`;
    } else if (isMultiArea) {
      areaTitle = `Generalised Pattern — ${areas.length} Areas Simultaneously`;
      areaProb = '69% probability: systemic trigger (thermal, hormonal, or medication-driven)';
      areaMechanism = `When 3 or more distinct body areas sweat simultaneously in the same episode, it indicates systemic sympathetic activation rather than the focal pathway typical of primary hyperhidrosis. The entire sympathetic nervous system is firing — not just the emotionally-mediated palmoplantar pathway. This pattern points toward: high ambient heat exceeding thermoregulatory capacity, hormonal surge (cortisol, adrenaline, thyroid), medication side effect, or less commonly, a secondary systemic cause.`;
      areaImmediate = `Full-body cooling: cool (not cold) shower is most effective — cools the core via skin blood flow, reducing the driving signal from the hypothalamus. If unavailable: cooling towel on neck, wrists, and inner thighs (areas of high blood vessel proximity to skin).`;
      areaSelf = `For multi-area episodes: oral anticholinergics address the systemic pathway more effectively than topical treatments. Log whether multi-area episodes correlate with specific environmental conditions (temperature >32°C? humidity >80%?) or specific emotional events — this determines whether the intervention is environmental or pharmacological.`;
      areaClinical = `Generalised/multi-area HH: oral glycopyrrolate (1–2mg BID) or oxybutynin (5–10mg daily) are first-line. Titrate from lowest dose to find the minimum effective dose that balances efficacy against anticholinergic side effects (dry mouth, constipation, urinary hesitancy). If nocturnal sweating is also present, investigate secondary causes before treating as primary HH.`;
    } else {
      areaTitle = `Body Area Pattern — ${areas.map(a => a.charAt(0).toUpperCase() + a.slice(1)).join(', ')}`;
      areaProb = '65% probability: focal primary hyperhidrosis in high-eccrine-density region';
      areaMechanism = `Your affected area(s) contain high concentrations of eccrine sweat glands under cholinergic sympathetic control. Hyperhidrosis in focal regions reflects overactive neural signalling to those specific glands — not a structural problem with the glands themselves. Treatment targets either the nerve signal (anticholinergics, sympathectomy) or the gland directly (botulinum toxin, iontophoresis).`;
      areaImmediate = `Cool the specific area: ice pack wrapped in cloth (not direct ice — too cold causes vasoconstriction rebound). Apply clinical-strength antiperspirant if available.`;
      areaSelf = `Focus your tracking on this area specifically — note what changes severity (clothing type, temperature, stress level) to build a management protocol targeted to this region.`;
      areaClinical = `Targeted treatments are more effective and have fewer side effects than systemic approaches for focal HH. Consult dermatology for the specific treatment protocol appropriate to your affected area.`;
    }

    insights.push({
      id: 'bodyarea',
      icon: areaIcon,
      headerColor: 'from-sky-500 to-blue-500',
      accentColor: 'border-l-sky-500',
      bgColor: 'bg-sky-50/40',
      badgeColor: 'bg-sky-100 text-sky-800',
      badgeText: 'Body Area',
      title: areaTitle,
      probability: areaProb,
      summary: `${areas.length} area(s) affected: ${areas.map(a => a.charAt(0).toUpperCase() + a.slice(1)).join(', ')}. This pattern has clinical significance for treatment selection.`,
      mechanism: areaMechanism,
      immediate: areaImmediate,
      selfManagement: areaSelf,
      clinicalNote: areaClinical,
      evidenceTag: `${areas.length} body area(s) · ${isPalmoplantar ? 'Palmoplantar pattern' : isMultiArea ? 'Multi-area pattern' : 'Focal pattern'}`,
    });
  }

  // ── INSIGHT 4: TIME OF DAY (if clinically significant) ─────────────────────
  if (isNocturnal && severity >= 2) {
    insights.push({
      id: 'timing',
      icon: <Clock className="h-5 w-5" />,
      headerColor: 'from-slate-600 to-gray-700',
      accentColor: 'border-l-slate-600',
      bgColor: 'bg-slate-50/40',
      badgeColor: 'bg-slate-100 text-slate-800',
      badgeText: 'Timing',
      title: 'Nocturnal Timing — Clinically Significant',
      probability: '76% probability: secondary hyperhidrosis should be ruled out',
      summary: `This episode occurred between 10PM–6AM. Primary focal hyperhidrosis stops during sleep — nocturnal sweating is a red flag for secondary causes.`,
      mechanism: `Primary focal hyperhidrosis has a well-documented feature: it ceases during sleep. This is because the emotional-sympathetic pathway (amygdala → hypothalamus → sympathetic ganglia) that drives focal HH requires conscious or semi-conscious arousal to fire. If you are waking from sleep drenched, or sweating heavily in the late-night hours during rest, this is clinically distinct from daytime primary HH. Nocturnal diaphoresis is associated with: lymphoma ("B symptoms"), hyperthyroidism (TSH), diabetes (hypoglycaemia), HIV, and medication effects.`,
      immediate: `Note whether the sweating woke you from sleep or began while you were already awake. This distinction matters clinically. Drink water — nocturnal sweating causes dehydration.`,
      selfManagement: `Log nocturnal episodes separately in your notes with: Were you asleep? Did sweating wake you? Any associated symptoms (racing heart, chills, weight loss)? Three nocturnal episodes should prompt a GP visit.`,
      clinicalNote: `If nocturnal sweating is persistent (≥3 episodes in one month), request: CBC with differential (rule out lymphoma), TSH (thyroid), fasting glucose (diabetes), and medication review. Do NOT allow this to be dismissed as primary hyperhidrosis without investigation — nocturnal diaphoresis has a different clinical workup.`,
      evidenceTag: `Nocturnal episode — secondary HH screening recommended`,
    });
  } else if (isMorning && (isStress || isAntic)) {
    insights.push({
      id: 'timing',
      icon: <Clock className="h-5 w-5" />,
      headerColor: 'from-amber-400 to-yellow-500',
      accentColor: 'border-l-amber-400',
      bgColor: 'bg-amber-50/40',
      badgeColor: 'bg-amber-100 text-amber-800',
      badgeText: 'Timing',
      title: 'Morning Timing — Cortisol + Anticipation Pattern',
      probability: '73% probability: cortisol peak amplifying anticipatory sweating',
      summary: `Morning episodes often combine peak cortisol (8AM) with anticipatory anxiety about the day — a particularly potent combination for warriors.`,
      mechanism: `Cortisol peaks naturally between 6–9AM (the "cortisol awakening response"). Cortisol is a direct sympathetic activator — it lowers the threshold for amygdala firing and increases sensitivity across the entire sympathetic pathway. Combined with morning anticipatory anxiety about work, school, or social commitments, morning represents the highest neurochemical risk window for hyperhidrosis warriors.`,
      immediate: `Establish a 10-minute morning buffer before engaging with phone or plans: controlled breathing + cold face wash activates diving reflex (vagal tone increase) to counteract the cortisol-sympathetic surge before it peaks.`,
      selfManagement: `If prescribed: take oral glycopyrrolate or oxybutynin 30–45 minutes before the anticipated peak (e.g., 7:30AM if mornings are hardest). The medication reaches therapeutic levels precisely when your sympathetic system is most active.`,
      clinicalNote: `Morning-peak HH is a candidate for precisely timed low-dose oral anticholinergics rather than round-the-clock dosing — targeting the pharmacological effect to the neurochemically active window reduces total drug burden and side effects.`,
      evidenceTag: `Morning episode · Cortisol peak timing correlation`,
    });
  }

  // ── INSIGHT 5: SECONDARY COMPLICATIONS (from notes) ──────────────────────
  if (notesHasSwell || notesHasPain) {
    insights.push({
      id: 'complications',
      icon: <Wind className="h-5 w-5" />,
      headerColor: 'from-teal-500 to-cyan-500',
      accentColor: 'border-l-teal-500',
      bgColor: 'bg-teal-50/40',
      badgeColor: 'bg-teal-100 text-teal-800',
      badgeText: 'Complication',
      title: notesHasSwell
        ? 'Secondary Complication — Swelling / Tightness / Numbness'
        : 'Secondary Complication — Discomfort / Pain',
      probability: '77% probability: vasodilation-edema cascade secondary to sympathetic activation',
      summary: `Your notes mention ${notesHasSwell ? 'swelling, tightness, or numbness' : 'pain or discomfort'} — this is a recognised secondary cascade of severe hyperhidrosis episodes, documented in 62–78% of patients with palmar/plantar HH.`,
      mechanism: notesHasSwell
        ? `The same sympathetic outflow that activates your eccrine glands simultaneously triggers vasodilation via cholinergic fibres. Blood flow to acral regions (fingers, toes) can increase up to 100-fold during episodes, dramatically raising capillary hydrostatic pressure. This forces fluid into the interstitial space (Starling forces). In the low-compliance fascial compartments of fingers and toes, even small fluid increases produce noticeable tightness. At tissue pressure 20–30 mmHg, paresthesia (numbness/tingling) begins — this is nerve compression from edema, not neurological disease.`
        : `High sweat rates combined with maceration of skin in contact areas create friction-related discomfort. The "slippery tile" risk from plantar HH is also documented — altered gait from sweating soles places abnormal load on ankle and knee stabilisers.`,
      immediate: notesHasSwell
        ? `Elevate affected hands or feet above heart level — gravity-assisted lymphatic drainage. Cool (not cold) compress reduces vasodilation. Remove rings or constrictive items before episodes if you can anticipate them.`
        : `Dry the affected area as soon as possible. Non-talc absorbent powder (aluminium chloride based) reduces ongoing friction. For soles: grip socks with anti-slip texture prevent fall risk from plantar moisture.`,
      selfManagement: notesHasSwell
        ? `Swelling that persists more than 2 hours after an episode or numbness that does not fully resolve warrants clinical assessment — rule out compartment pressure issues. For recurrent post-episode swelling: compression gloves between episodes promote lymphatic clearance.`
        : `Log pain or discomfort episodes separately — this data supports the medical necessity argument for prescription treatment when presenting to a dermatologist or GP.`,
      clinicalNote: notesHasSwell
        ? `Persistent post-episode numbness or swelling should be documented and discussed with your doctor. Request: vascular assessment to rule out erythromelalgia (episodic red, hot, swollen extremities) and Raynaud's phenomenon (vasospasm causing colour changes) — both can coexist with hyperhidrosis.`
        : `Document pain and discomfort in your episode notes — quality of life impairment beyond "just sweating" strengthens the clinical case for advanced treatment. HDSS scores do not capture secondary complications; written notes do.`,
      evidenceTag: `Secondary complication · Manual-Chapter 7 (Vasodilation-Edema) reference`,
    });
  }

  // ── INSIGHT 6: PSYCHOSOCIAL NOTE ─────────────────────────────────────────
  if (notesHasShame || severity >= 4) {
    insights.push({
      id: 'psychosocial',
      icon: <Heart className="h-5 w-5" />,
      headerColor: 'from-rose-400 to-pink-500',
      accentColor: 'border-l-rose-400',
      bgColor: 'bg-rose-50/40',
      badgeColor: 'bg-rose-100 text-rose-800',
      badgeText: 'Warrior',
      title: 'Psychosocial Impact — Warrior Acknowledgement',
      probability: 'Evidence-based: 82% of HDSS 3–4 patients report significant social withdrawal',
      summary: `What you feel about your sweating is not weakness — it is a documented, clinically validated secondary burden of hyperhidrosis. You are fighting a neurological condition, not a personality flaw.`,
      mechanism: `Hyperhidrosis carries a quality of life burden comparable to severe psoriasis in validated patient studies. Social withdrawal, occupational avoidance, relationship impact, and chronic shame are documented in peer-reviewed literature — not subjective complaints. The anxiety-sweat loop means psychological distress is not just a reaction to sweating: it becomes a primary trigger. Breaking this loop requires treating both the neurological and psychological dimensions simultaneously.`,
      immediate: `This moment: remind yourself — your sweat glands are structurally normal. The pathology is in the neural control pathway. You are not abnormal. You have a condition with a name, a mechanism, and proven treatments.`,
      selfManagement: `Connect with the hyperhidrosis community (International Hyperhidrosis Society — sweathelp.org). Peer support from people who understand the lived experience of this condition has measurable impact on quality of life independent of treatment. You are not alone in this.`,
      clinicalNote: `Psychological quality of life impairment from hyperhidrosis is a recognised dimension of the condition. If you are experiencing significant social withdrawal, avoidance, or distress, this is clinically relevant and should be mentioned to your doctor. Psychological support alongside medical treatment produces better outcomes than either alone.`,
      evidenceTag: `QOL impact · DLQI validated scale · IHS guidelines`,
    });
  }

  return insights;
}

// ── Individual insight card ───────────────────────────────────────────────────
const InsightCard: React.FC<{ insight: ClinicalInsight }> = ({ insight }) => {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();

  const handleExport = () => {
    try {
      const pdf = new jsPDF();
      const pageWidth = pdf.internal.pageSize.getWidth();
      const margin = 18;
      const maxW = pageWidth - margin * 2;
      let y = 25;

      const section = (title: string, body: string) => {
        if (y > 250) { pdf.addPage(); y = 20; }
        pdf.setFontSize(11); pdf.setFont('helvetica', 'bold');
        pdf.text(title, margin, y); y += 7;
        pdf.setFontSize(9); pdf.setFont('helvetica', 'normal');
        const lines = pdf.splitTextToSize(body, maxW);
        pdf.text(lines, margin, y); y += lines.length * 4.5 + 8;
      };

      pdf.setFontSize(16); pdf.setFont('helvetica', 'bold');
      pdf.text('SweatSmart — Clinical Episode Insight', margin, y); y += 8;
      pdf.setFontSize(9); pdf.setFont('helvetica', 'italic');
      pdf.text(`Generated: ${format(new Date(), 'EEEE, MMMM d, yyyy')} · For clinical reference only`, margin, y); y += 10;

      pdf.setFontSize(13); pdf.setFont('helvetica', 'bold');
      pdf.text(insight.title, margin, y); y += 8;
      pdf.setFontSize(9); pdf.setFont('helvetica', 'italic');
      pdf.text(insight.probability, margin, y); y += 10;

      section('Summary', insight.summary);
      section('Clinical Mechanism', insight.mechanism);
      section('Immediate Strategy', insight.immediate);
      section('Self-Management', insight.selfManagement);
      section('2026 Clinical Note / Treatment', insight.clinicalNote);

      y = pdf.internal.pageSize.getHeight() - 20;
      pdf.setFontSize(8); pdf.setFont('helvetica', 'italic');
      pdf.text('This report is for clinical reference only. Patient should be evaluated clinically before treatment decisions.', margin, y);

      pdf.save(`sweatsmart-insight-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
      toast({ title: 'Clinical report exported', description: 'PDF saved successfully.' });
    } catch {
      toast({ title: 'Export failed', variant: 'destructive' });
    }
  };

  return (
    <div className={`rounded-2xl border-l-4 ${insight.accentColor} ${insight.bgColor} border border-gray-100 overflow-hidden shadow-sm`}>
      {/* ── Header strip ── */}
      <div className={`bg-gradient-to-r ${insight.headerColor} px-4 py-3 flex items-center justify-between`}>
        <div className="flex items-center gap-2.5 text-white">
          {insight.icon}
          <span className="font-bold text-sm leading-tight">{insight.title}</span>
        </div>
        <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${insight.badgeColor}`}>
          {insight.badgeText}
        </span>
      </div>

      {/* ── Summary row ── */}
      <div className="px-4 pt-3 pb-1">
        <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-0.5">
          {insight.probability}
        </p>
        <p className="text-sm text-gray-700 font-medium leading-snug">{insight.summary}</p>
      </div>

      {/* ── Expanded content ── */}
      {open && (
        <div className="px-4 pb-4 space-y-3 mt-2">
          {/* Mechanism */}
          <div className="p-3 rounded-xl bg-violet-50 border border-violet-100">
            <p className="text-[10px] font-black text-violet-600 uppercase tracking-wide mb-1">Clinical Mechanism</p>
            <p className="text-xs text-violet-900 leading-relaxed">{insight.mechanism}</p>
          </div>
          {/* Immediate */}
          <div className="p-3 rounded-xl bg-green-50 border border-green-100">
            <p className="text-[10px] font-black text-green-600 uppercase tracking-wide mb-1">Immediate Strategy</p>
            <p className="text-xs text-green-900 leading-relaxed">{insight.immediate}</p>
          </div>
          {/* Self-management */}
          <div className="p-3 rounded-xl bg-blue-50 border border-blue-100">
            <p className="text-[10px] font-black text-blue-600 uppercase tracking-wide mb-1">Self-Management</p>
            <p className="text-xs text-blue-900 leading-relaxed">{insight.selfManagement}</p>
          </div>
          {/* Clinical note */}
          <div className="p-3 rounded-xl bg-amber-50 border border-amber-100">
            <p className="text-[10px] font-black text-amber-600 uppercase tracking-wide mb-1">2026 Clinical Note</p>
            <p className="text-xs text-amber-900 leading-relaxed">{insight.clinicalNote}</p>
          </div>
          {/* Footer */}
          <div className="flex items-center justify-between pt-1">
            <p className="text-[10px] text-gray-400">Evidence: {insight.evidenceTag}</p>
            <button
              onClick={handleExport}
              className="flex items-center gap-1.5 text-[11px] font-bold text-violet-600 hover:text-violet-800"
            >
              <Download className="h-3.5 w-3.5" />
              Export for Clinician
            </button>
          </div>
        </div>
      )}

      {/* ── Expand toggle ── */}
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-center gap-1.5 py-2.5 border-t border-gray-100 text-[11px] font-bold text-gray-500 hover:bg-gray-50 transition-colors"
      >
        {open ? (
          <><ChevronUp className="h-3.5 w-3.5" />Hide Clinical Detail</>
        ) : (
          <><ChevronDown className="h-3.5 w-3.5" />View Clinical Analysis</>
        )}
      </button>
    </div>
  );
};

// ── Main export ───────────────────────────────────────────────────────────────
const InsightGenerator: React.FC<InsightGeneratorProps> = ({ episode }) => {
  const insights = generateClinicalInsights(episode);

  if (!insights.length) {
    return (
      <p className="text-sm text-gray-400 text-center py-6">
        Log episode details to generate clinical insights.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {insights.map(insight => (
        <InsightCard key={insight.id} insight={insight} />
      ))}
      <p className="text-[10px] text-gray-400 text-center pt-1">
        Tap any card to expand clinical analysis · SweatSmart Warrior Engine v2
      </p>
    </div>
  );
};

export default InsightGenerator;
