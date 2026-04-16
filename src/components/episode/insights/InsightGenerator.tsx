/**
 * InsightGenerator.tsx — SweatSmart Episode Insight Engine
 *
 * Friendly, plain-language insights for hyperhidrosis episodes.
 * Uses ALL episode data: severity, body areas, triggers, notes, time of day.
 * Works as a standalone engine — no AI credits required.
 */

import React, { useState } from 'react';
import { ProcessedEpisode } from '@/types';
import {
  Thermometer, Heart, Brain, Droplets, AlertTriangle,
  Activity, Clock, Zap, Wind, ChevronDown, ChevronUp,
  Shield, Download
} from 'lucide-react';
import jsPDF from 'jspdf';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

interface InsightGeneratorProps {
  episode: ProcessedEpisode;
}

// ── Insight shape ────────────────────────────────────────────────────
interface clinicalInsight {
  id: string;
  icon: React.ReactNode;
  headerColor: string;      // gradient on the header strip
  accentColor: string;      // left border colour class
  bgColor: string;          // card background
  badgeColor: string;       // status badge
  badgeText: string;
  title: string;
  probability: string;      // Friendly probability statement
  summary: string;          // 1-sentence hook
  mechanism: string;        // WHY this happened — plain language explanation
  immediate: string;        // What to do right now
  selfManagement: string;   // Longer term strategy
  clinicalNote: string;     // Friendly clinical guidance
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
function generateInsights(episode: ProcessedEpisode): clinicalInsight[] {
  const insights: clinicalInsight[] = [];

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

  // Body area flags
  const hasPalms    = areas.some(a => a.toLowerCase().includes('palm'));
  const hasSoles    = areas.some(a => a.toLowerCase().includes('sole') || a.toLowerCase().includes('feet') || a.toLowerCase().includes('foot'));
  const hasAxillae  = areas.some(a => a.toLowerCase().includes('arm') || a.toLowerCase().includes('under'));
  const hasFace     = areas.some(a => a.toLowerCase().includes('face') || a.toLowerCase().includes('scalp') || a.toLowerCase().includes('head'));
  const isPalmoplantar = hasPalms && hasSoles;

  // Time flags
  const isMorning   = episodeHour >= 5  && episodeHour < 12;
  const isNocturnal = episodeHour >= 22 || episodeHour < 5;

  // Notes flags
  const notesHasSwell = hasKeyword(notes, 'swell', 'tight', 'numb', 'tingle', 'puffy');
  const notesHasShame = hasKeyword(notes, 'embarrass', 'shame', 'hate', 'avoid', 'cancel', 'hide');
  const notesHasPain  = hasKeyword(notes, 'pain', 'hurt', 'sting', 'burn', 'slip');

  // ── INSIGHT 1: SEVERITY — always generated ─────────────────────────────────
  const hdssLabel = severity >= 4
    ? 'Intolerable'
    : severity === 3
    ? 'Barely Tolerable'
    : severity === 2
    ? 'Tolerable'
    : 'Never Noticeable';

  const severityMechanism = severity >= 4
    ? `At this level, your body's "cool down" system is firing at maximum intensity. Your sweat glands are receiving constant signals that overwhelm your body's ability to reabsorb moisture. This high severity level is a clear sign that it's time to seek specialist help from a dermatologist, as simple over-the-counter fixes might not be enough.`
    : severity === 3
    ? `This is a clinical tipping point where sweating starts to frequently get in the way of your daily life. Your nervous system is over-reacting to triggers with a much lower threshold than usual. This isn't something you're doing wrong—it's just your body's signals being a bit too sensitive.`
    : `This episode shows your body was triggered but not completely overwhelmed. You produced extra sweat, but it stayed within a manageable range. The goal now is to identify what set this off so you can prevent it from escalating next time.`;

  const severityImmediate = severity >= 4
    ? `Get out of the triggering environment immediately. Run cold water over your wrists and the back of your neck. These "pulse points" help cool your core temperature quickly and tell your brain to ease up on the sweat signals.`
    : severity === 3
    ? `Move to a cooler or quieter spot. Try the 4-7-8 breathing technique (breathe in for 4, hold for 7, out for 8). This simple trick helps calm your nervous system and stops the "sweat signal" in its tracks.`
    : `Try not to worry too much about the episode—worrying can actually make the sweating worse. Use a simple grounding exercise like naming 5 things you can see to pull your brain out of the sweat-stress loop.`;

  const severityClinical = severity >= 4
    ? `Since your sweating is intolerable, you're a good candidate for prescription options like Botox injections, specialized wipes (Qbrexza), or a permanent underarm treatment called miraDry. A dermatologist can help you decide which one is right for you.`
    : severity === 3
    ? `At this level, prescription-strength antiperspirants (containing 20% aluminium chloride) applied at night are usually the first step. You might also want to ask a doctor about oral medications or water-bath treatments (iontophoresis).`
    : `Over-the-counter clinical-strength antiperspirants are often enough for this level. Make sure to apply them to completely dry skin right before bed for the best results.`;

  insights.push({
    id: 'severity',
    icon: severity >= 4 ? <AlertTriangle className="h-5 w-5" /> : <Zap className="h-5 w-5" />,
    headerColor: severity >= 4 ? 'from-red-500 to-rose-500' : severity === 3 ? 'from-indigo-500 to-violet-500' : 'from-blue-400 to-cyan-400',
    accentColor: severity >= 4 ? 'border-l-red-500' : severity === 3 ? 'border-l-indigo-500' : 'border-l-blue-400',
    bgColor: severity >= 4 ? 'bg-red-50/40' : severity === 3 ? 'bg-indigo-50/40' : 'bg-blue-50/40',
    badgeColor: severity >= 4 ? 'bg-red-100 text-red-800' : severity === 3 ? 'bg-indigo-100 text-indigo-800' : 'bg-blue-100 text-blue-700',
    badgeText: severity >= 4 ? 'High Severity' : severity === 3 ? 'Significant' : 'Moderate',
    title: `Episode Severity — ${hdssLabel}`,
    probability: `This level of severity usually suggests it's time for specialized care`,
    summary: severity >= 4
      ? `This was a peak-severity episode, meaning your body is sending out its strongest sweat signals.`
      : severity === 3
      ? `This episode frequently interfered with your day, showing your "on switch" for sweat is quite sensitive.`
      : `A moderate episode where your body reacted to a trigger, but stayed manageable.`,
    mechanism: severityMechanism,
    immediate: severityImmediate,
    selfManagement: `Try to note exactly what you were doing 30 minutes before this happened. After a few logs, you'll start to see your "trigger sequence"—the specific combination of things that pushes your body over the edge.`,
    clinicalNote: severityClinical,
    evidenceTag: `HDSS Scale Analysis · Severity ${severity}/4`,
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
      trigTitle = 'Trigger — Heat & Humidity';
      trigProb = 'The heat likely overwhelmed your body\'s natural cooling';
      trigMechanism = `When it's hot, your brain tells your sweat glands to kick in to cool you down. But when it's humid (above 70%), that sweat can't evaporate, so your body just keeps producing more and more in a frustrating loop. It's essentially a "failed mission" where your body tries to cool you down using a method that the air won't allow.`;
      trigImmediate = `Use a fan! Moving air across your skin helps that sweat evaporate even when it's humid. Target your neck and wrists for the fastest relief.`;
      trigSelfManagement = `Try "pre-cooling" by taking a cool shower before you head into a hot environment. This gives your body a longer "buffer" before it feels the need to start sweating.`;
      trigClinical = `If heat always sets you off, clinical-strength antiperspirants applied at night are your best first defense. For hands and feet, a water-bath treatment (iontophoresis) is highly effective at "quieting" those glands.`;
      trigIcon = <Thermometer className="h-5 w-5" />;
    } else if (isStress || isAntic) {
      trigTitle = isAntic ? 'Trigger — Anticipation' : 'Trigger — Stress & Anxiety';
      trigProb = 'Your brain\'s "alarm" system likely fired before the stress even arrived';
      trigMechanism = `Your brain's alarm system—the part that reacts to threats—is directly connected to your sweat glands. In hyperhidrosis, this system is a bit too trigger-happy, firing the sweat signal faster than you can even think. This is why you might start sweating *before* a big event—your brain is "preparing" for a situation it remembers as being uncomfortable.`;
      trigImmediate = `The 4-7-8 breathing trick is your best friend here. Breathe in for 4 seconds, hold for 7, and out for 8. Doing this just 3 times can "reset" your nervous system and quiet the sweat signal.`;
      trigSelfManagement = `Practice your breathing exercises when you're *not* stressed. If your body is already familiar with them, they'll work much better when an episode actually starts.`;
      trigClinical = `If stress is your main driver, a doctor might suggest a low-dose oral medication taken only when you know you have a high-stakes event coming up. This can "block" the signal to your sweat glands during that specific window.`;
      trigIcon = <Brain className="h-5 w-5" />;
      trigHeader = 'from-purple-500 to-violet-500';
      trigAccent = 'border-l-purple-500';
      trigBg = 'bg-purple-50/40';
      trigBadge = 'bg-purple-100 text-purple-800';
    } else if (isSocial) {
      trigTitle = 'Trigger — Social Settings';
      trigProb = 'Social pressure likely set off an automatic sweat response';
      trigMechanism = `Being around people can make your brain feel like it's being "evaluated," which triggers a physical stress response. Your body has learned to associate social situations with sweating, so it fires the signal automatically. It's like a reflex that has become a bit too well-trained over time.`;
      trigImmediate = `Try the 5-4-3-2-1 grounding method: find 5 things you can see, 4 you can touch, 3 you can hear, 2 you can smell, and 1 you can taste. This pulls your brain out of its internal worry and back into the real world, which can help stop the sweating loop.`;
      trigSelfManagement = `Try small social interactions first to "re-train" your brain that these situations aren't threats. Over time, your body will learn to stay calmer in larger groups.`;
      trigClinical = `Many people find that a combination of therapy (to manage the social worry) and medical treatment (to stop the physical sweating) works best. When you stop the sweating, the social anxiety often starts to fade too.`;
      trigIcon = <Heart className="h-5 w-5" />;
      trigHeader = 'from-pink-500 to-rose-400';
      trigAccent = 'border-l-pink-500';
      trigBg = 'bg-pink-50/40';
      trigBadge = 'bg-pink-100 text-pink-800';
    } else if (isDietary) {
      trigTitle = 'Trigger — Food & Drink';
      trigProb = 'What you ate or drank likely tricked your body into sweating';
      trigMechanism = `Spicy foods contain a compound (capsaicin) that literally tricks your brain into thinking you're overheating. Caffeine and alcohol also dial up your body's "alert" level, making it much easier for your sweat glands to be triggered. It's a simple chemical reaction in your body, not a sign of poor health.`;
      trigImmediate = `Sip cold water slowly after eating something spicy. This helps cool down the "heat receptors" in your mouth and can ease the sweat signal.`;
      trigSelfManagement = `Keep a simple log of which foods seem to set you off. You might find that one cup of coffee is fine, but a second one is what pushes you over the edge.`;
      trigClinical = `If specific foods always cause facial sweating, there are newer prescription gels (like Sofdra) that can be applied to the face to block those signals without affecting the rest of your body.`;
      trigIcon = <Droplets className="h-5 w-5" />;
      trigHeader = 'from-green-500 to-emerald-500';
      trigAccent = 'border-l-green-500';
      trigBg = 'bg-green-50/40';
      trigBadge = 'bg-green-100 text-green-800';
    } else {
      trigTitle = 'Logged Trigger';
      trigProb = 'This factor likely pushed your body\'s sweat signals over the edge';
      trigMechanism = `Whatever the trigger, the result is the same: your brain sent a "start sweating" signal to your glands through your nervous system. In hyperhidrosis, this signal is just much louder and easier to set off than in other people. The goal is to figure out if your triggers are mostly environmental (like heat) or internal (like stress).`;
      trigImmediate = `If you can, step away from whatever is triggering you. Even a 5-minute break in a quiet or cool spot can help your body reset.`;
      trigSelfManagement = `Keep logging this trigger! After a few more entries, our pattern analysis can tell you for sure if it's a consistent driver for you or just a one-off.`;
      trigClinical = `If this trigger consistently causes high-severity episodes, it's worth mentioning to a dermatologist. They can help you find a treatment that specifically targets the neural pathway involved.`;
    }

    insights.push({
      id: 'trigger',
      icon: trigIcon,
      headerColor: trigHeader,
      accentColor: trigAccent,
      bgColor: trigBg,
      badgeColor: trigBadge,
      badgeText: 'Trigger Analysis',
      title: trigTitle,
      probability: trigProb,
      summary: `Your logged trigger set off your body's sweat response. Here's a plain-language look at why that happened.`,
      mechanism: trigMechanism,
      immediate: trigImmediate,
      selfManagement: trigSelfManagement,
      clinicalNote: trigClinical,
      evidenceTag: `Trigger Pattern Analysis`,
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
      areaTitle = 'Pattern — Hands & Feet';
      areaProb = 'This is a classic pattern of primary hyperhidrosis';
      areaMechanism = `Sweating on both your hands and feet at the same time is very common. Both areas have the highest density of sweat glands and are mostly controlled by your "fight or flight" system rather than actual heat. This means your hands and feet are reacting to your thoughts and environment with millisecond speed. It's a neurological glitch, not a sign of any other health problem.`;
      areaImmediate = `For your palms: press them firmly against a cool, dry surface. For your feet: try to get some air moving over them as soon as it's safe to do so.`;
      areaSelf = `Consider a water-bath treatment (iontophoresis). It's one of the most effective ways to treat hands and feet, works for about 80-90% of people, and can be done right at home.`;
      areaClinical = `The treatment ladder for hands and feet usually goes: (1) 20% aluminium chloride antiperspirant at night; (2) Iontophoresis; (3) Botox injections. All of these are highly effective and reversible.`;
    } else if (hasFace) {
      areaTitle = 'Pattern — Face & Scalp';
      areaProb = 'Facial sweating often has a double-trigger of stress and food';
      areaMechanism = `Facial sweating is tough because it's so visible, which can create a "shame loop"—you sweat, you worry about people seeing it, so you sweat more. Your face also reacts to certain foods through an automatic reflex. The goal is to break this loop by using mattifying skincare and targeted treatments.`;
      areaImmediate = `Use simple oil-blotting papers to soak up moisture without making your skin red. A quick mist of cool water can also help "reset" your skin temperature.`;
      areaSelf = `Avoid your known food triggers before big social events. You can also carry cooling wipes to use discreetly if you feel an episode starting.`;
      areaClinical = `For facial sweating, a newer prescription gel called Sofdra is a game-changer. It blocks the signal to your sweat glands without the side effects of older oral medications.`;
    } else {
      areaTitle = `Pattern — ${areas[0]}`;
      areaProb = 'Your sweating is concentrated in a specific area';
      areaMechanism = `The areas you're tracking have a high concentration of sweat glands. In your case, these glands are receiving a signal that is "turned up too high." It's not that your glands are broken—it's that the signal telling them to work is too loud. Focused treatments that target just this area are usually the most effective.`;
      areaImmediate = `Cool the area with a wet cloth or a fan. Applying a clinical-strength antiperspirant even *during* an episode can sometimes provide a bit of relief a few hours later.`;
      areaSelf = `Focus your tracking on this area specifically. Notice if certain clothes or temperatures make it better or worse so you can build your own personal "management kit."`;
      areaClinical = `Targeted treatments like Botox or miraDry (for underarms) are excellent for this pattern because they stop the sweating in just one area without affecting the rest of your body.`;
    }

    insights.push({
      id: 'bodyarea',
      icon: areaIcon,
      headerColor: 'from-sky-500 to-blue-500',
      accentColor: 'border-l-sky-500',
      bgColor: 'bg-sky-50/40',
      badgeColor: 'bg-sky-100 text-sky-800',
      badgeText: 'Area Analysis',
      title: areaTitle,
      probability: areaProb,
      summary: `Sweating in your ${areas.join(', ')} follows a known pattern. Here's what that means for your treatment options.`,
      mechanism: areaMechanism,
      immediate: areaImmediate,
      selfManagement: areaSelf,
      clinicalNote: areaClinical,
      evidenceTag: `Body Area Pattern Analysis`,
    });
  }

  // ── INSIGHT 4: TIME OF DAY ─────────────────────
  if (isNocturnal && severity >= 2) {
    insights.push({
      id: 'timing',
      icon: <Clock className="h-5 w-5" />,
      headerColor: 'from-slate-600 to-gray-700',
      accentColor: 'border-l-slate-600',
      bgColor: 'bg-slate-50/40',
      badgeColor: 'bg-slate-100 text-slate-800',
      badgeText: 'Timing Note',
      title: 'Nighttime Sweating',
      probability: 'This is an important pattern to discuss with a doctor',
      summary: `Primary hyperhidrosis usually stops during sleep. If you're sweating heavily at night, it's worth looking into other causes.`,
      mechanism: `Normal hyperhidrosis usually "goes to sleep" when you do because your nervous system is at rest. If you're waking up drenched, it could be related to medications, your thyroid, or blood sugar levels. It doesn't necessarily mean anything is wrong, but it's a pattern that doctors like to investigate.`,
      immediate: `Drink some water—sweating at night can make you dehydrated. Note if you were actually asleep when it started or just resting.`,
      selfManagement: `Keep a special note of these nighttime episodes. If it happens 3 or more times in a month, definitely schedule a check-up with your GP.`,
      clinicalNote: `When you see your doctor, specifically ask for a "blood panel" to rule out thyroid issues or other common causes of night sweats. Don't let it be dismissed as just "normal" sweating without a quick check.`,
      evidenceTag: `Nocturnal Pattern Note`,
    });
  } else if (isMorning && isStress) {
    insights.push({
      id: 'timing',
      icon: <Clock className="h-5 w-5" />,
      headerColor: 'from-amber-400 to-yellow-500',
      accentColor: 'border-l-amber-400',
      bgColor: 'bg-amber-50/40',
      badgeColor: 'bg-amber-100 text-amber-800',
      badgeText: 'Timing Note',
      title: 'The Morning Rush',
      probability: 'Your body\'s natural morning rhythm likely played a role',
      summary: `Mornings are a "high-risk" time for sweating because your stress hormones naturally peak right after you wake up.`,
      mechanism: `Your body's natural "wake up" chemicals (like cortisol) peak between 6 and 9 AM. These chemicals are direct triggers for your sweat glands. When you combine that with the stress of a new day, it's very common for warriors to have their toughest episodes in the morning.`,
      immediate: `Give yourself 10 minutes of "quiet time" right after waking up before you check your phone or start your routine. A quick face wash with cool water can also help "reset" your system.`,
      selfManagement: `If you're using a prescription antiperspirant, applying it *the night before* is crucial. It gives the treatment time to work so it's ready for that morning peak.`,
      clinicalNote: `Some people find that taking a low-dose oral medication right after waking up (or even the night before) can provide perfect coverage for the morning hours without needing to take it all day long.`,
      evidenceTag: `Morning Rhythm Analysis`,
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
      badgeText: 'Follow-up',
      title: notesHasSwell ? 'Swelling & Tightness' : 'Pain & Discomfort',
      probability: 'This is a common secondary effect of severe episodes',
      summary: `You mentioned ${notesHasSwell ? 'swelling or tightness' : 'pain'}—this is a real physical effect that happens when your body's "cool down" system over-fires.`,
      mechanism: `When you sweat heavily, your blood vessels also open up to help release heat. This can cause extra fluid to build up in your fingers or toes, leading to that "puffy" or tight feeling. It's not a separate disease—it's just a side effect of the intense sweating episode.`,
      immediate: `If your hands or feet feel swollen, try elevating them above your heart level for a few minutes. A cool (not ice-cold) compress can also help reduce the swelling.`,
      selfManagement: `Log how long the swelling lasts. If it stays for more than 2 hours after the sweating stops, that's something you should definitely mention to your doctor.`,
      clinicalNote: `Make sure to mention this swelling to your doctor. It helps prove that your sweating is causing real physical changes in your body, which makes the case for getting advanced treatments approved by insurance.`,
      evidenceTag: `Physical Complication Note`,
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
      badgeText: 'Warrior Support',
      title: 'The Emotional Weight',
      probability: 'You are not alone—most warriors feel this same weight',
      summary: `What you're feeling isn't a weakness. Living with this condition is genuinely exhausting, and it's okay to acknowledge that.`,
      mechanism: `Studies show that hyperhidrosis has a huge impact on quality of life—sometimes even more than severe skin conditions like psoriasis. The constant "worry loop" (worrying about sweating, which causes more sweating) is a documented medical part of the condition, not a personality flaw.`,
      immediate: `Take a deep breath and remind yourself: your sweat glands are normal. It's just a signal glitch. You are not "disgusting" or "weird"—you're fighting a recognized medical condition.`,
      selfManagement: `Connecting with others who have hyperhidrosis can be life-changing. Check out the International Hyperhidrosis Society (sweathelp.org) for stories and support from people who truly get it.`,
      clinicalNote: `If you're feeling really down or avoiding social life because of this, please tell your doctor. They can provide support for the emotional side of the condition alongside the medical treatments. Both are equally important.`,
      evidenceTag: `Warrior Wellness Note`,
    });
  }

  return insights;
}

// ── Individual insight card ───────────────────────────────────────────────────
const InsightCard: React.FC<{ insight: clinicalInsight }> = ({ insight }) => {
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
      pdf.text('SweatSmart — Episode Insight', margin, y); y += 8;
      pdf.setFontSize(9); pdf.setFont('helvetica', 'italic');
      pdf.text(`Generated: ${format(new Date(), 'EEEE, MMMM d, yyyy')}`, margin, y); y += 10;

      pdf.setFontSize(13); pdf.setFont('helvetica', 'bold');
      pdf.text(insight.title, margin, y); y += 8;
      pdf.setFontSize(9); pdf.setFont('helvetica', 'italic');
      pdf.text(insight.probability, margin, y); y += 10;

      section('Summary', insight.summary);
      section('What\'s Happening', insight.mechanism);
      section('What To Do Now', insight.immediate);
      section('Long-term Strategy', insight.selfManagement);
      section('Doctor\'s Note / Treatment', insight.clinicalNote);

      y = pdf.internal.pageSize.getHeight() - 20;
      pdf.setFontSize(8); pdf.setFont('helvetica', 'italic');
      pdf.text('This report is for educational reference. Please discuss these insights with a healthcare professional.', margin, y);

      pdf.save(`sweatsmart-insight-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
      toast({ title: 'Report exported', description: 'Your PDF is ready.' });
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
            <p className="text-[10px] font-black text-violet-600 uppercase tracking-wide mb-1">What's Happening</p>
            <p className="text-xs text-violet-900 leading-relaxed">{insight.mechanism}</p>
          </div>
          {/* Immediate */}
          <div className="p-3 rounded-xl bg-green-50 border border-green-100">
            <p className="text-[10px] font-black text-green-600 uppercase tracking-wide mb-1">What To Do Now</p>
            <p className="text-xs text-green-900 leading-relaxed">{insight.immediate}</p>
          </div>
          {/* Self-management */}
          <div className="p-3 rounded-xl bg-blue-50 border border-blue-100">
            <p className="text-[10px] font-black text-blue-600 uppercase tracking-wide mb-1">Long-term Strategy</p>
            <p className="text-xs text-blue-900 leading-relaxed">{insight.selfManagement}</p>
          </div>
          {/* Clinical note */}
          <div className="p-3 rounded-xl bg-amber-50 border border-amber-100">
            <p className="text-[10px] font-black text-amber-600 uppercase tracking-wide mb-1">Doctor's Note</p>
            <p className="text-xs text-amber-900 leading-relaxed">{insight.clinicalNote}</p>
          </div>
          {/* Footer */}
          <div className="flex items-center justify-between pt-1">
            <p className="text-[10px] text-gray-400">{insight.evidenceTag}</p>
            <button
              onClick={handleExport}
              className="flex items-center gap-1.5 text-[11px] font-bold text-violet-600 hover:text-violet-800"
            >
              <Download className="h-3.5 w-3.5" />
              Download PDF
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
          <><ChevronUp className="h-3.5 w-3.5" />Hide Detail</>
        ) : (
          <><ChevronDown className="h-3.5 w-3.5" />View Analysis</>
        )}
      </button>
    </div>
  );
};

// ── Main export ───────────────────────────────────────────────────────────────
const InsightGenerator: React.FC<InsightGeneratorProps> = ({ episode }) => {
  const insights = generateInsights(episode);

  if (!insights.length) {
    return (
      <p className="text-sm text-gray-400 text-center py-6">
        Log episode details to generate insights.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {insights.map(insight => (
        <InsightCard key={insight.id} insight={insight} />
      ))}
      <p className="text-[10px] text-gray-400 text-center pt-1">
        Tap any card to expand analysis · SweatSmart Warrior Engine v2
      </p>
    </div>
  );
};

export default InsightGenerator;
