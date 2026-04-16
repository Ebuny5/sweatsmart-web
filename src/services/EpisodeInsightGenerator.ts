/**
 * EpisodeInsightGenerator.ts
 * 
 * Friendly, plain-language insights for hyperhidrosis episodes.
 * Provides fallback analysis when the AI service is unavailable.
 * Utilizes the Dr. Cody reasoning loop (silently) and clinical standards.
 */

interface Episode {
  severityLevel: number;
  triggers: Array<{ label: string; type: string; value?: string }>;
  bodyAreas: string[];
  datetime?: Date;
  notes?: string;
}

interface GeneratedInsights {
  clinicalAnalysis: string;
  immediateRelief: string[];
  treatmentOptions: string[];
  lifestyleModifications: string[];
  medicalAttention: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────
const lower = (s: string) => (s || '').toLowerCase();
const hasAny = (text: string, ...words: string[]) => words.some(w => text.includes(w));

class EpisodeInsightGenerator {

  generateCompleteInsight(episode: Episode): GeneratedInsights {
    return {
      clinicalAnalysis: this.buildClinicalAnalysis(episode),
      immediateRelief: this.buildReliefStrategies(episode),
      treatmentOptions: this.buildTreatmentRecommendations(episode),
      lifestyleModifications: this.buildLifestyleModifications(episode),
      medicalAttention: this.buildMedicalAttention(episode),
    };
  }

  private buildClinicalAnalysis(ep: Episode): string {
    const sev = ep.severityLevel;
    const areas = ep.bodyAreas.map(lower);
    const trigText = ep.triggers.map(t => lower(t.label || t.value || '')).join(' ');
    const notesText = lower(ep.notes || '');
    const areaList = this.formatBodyAreas(ep.bodyAreas);

    // 1. Clinical Classification (Silent)
    const isNocturnal = hasAny(notesText, 'night', 'sleep', 'wake up drenched', 'nocturnal');
    const isSudden = hasAny(notesText, 'sudden', 'started recently', 'adult onset');
    const isGeneralized = areas.length > 5 || hasAny(notesText, 'entire body', 'everywhere');

    // 2. Probability Distribution (Amygdala vs Hypothalamus)
    const isEmotional = hasAny(trigText, 'stress', 'anxiety', 'nervous', 'anger', 'anticipat', 'social', 'crowd', 'embarrass', 'exam', 'work pressure');
    const isThermal = hasAny(trigText, 'hot', 'heat', 'humid', 'temperature', 'sun', 'warm', 'outdoor');
    const isDietary = hasAny(trigText, 'spicy', 'caffein', 'alcohol', 'hot drink', 'energy drink');
    const isPhysical = hasAny(trigText, 'exercise', 'physical');

    // Friendly severity interpretation
    const severityText = sev >= 4
      ? 'Intolerable: sweating always interferes with your daily activities'
      : sev === 3
      ? 'Significant: sweating frequently interferes with your daily activities'
      : sev === 2
      ? 'Moderate: sweating sometimes interferes with your daily activities'
      : 'Mild: sweating rarely interferes with your daily activities';

    // 3. Neural Pathway Mapping & Human Filter
    let insight: string;

    if (isEmotional && isThermal) {
      insight = `It looks like your body's "cool down" system is getting a double-hit from both the heat and the stress of the situation. Your nervous system is sending out a "start sweating" signal much earlier and stronger than it needs to. This is a common physical overreaction where your brain thinks it needs to cool you down even though you're already comfortable.`;
    } else if (isEmotional) {
      insight = `This episode seems mostly driven by your body's reaction to stress or anticipation. Your nervous system (the "software") is overdriving your functionally normal sweat glands (the "hardware"). Your brain's "alert" system is directly triggering your sweat glands through the sympathetic chain, often before you even consciously feel anxious.`;
    } else if (isThermal) {
      insight = `The heat and humidity are the main drivers here. When it's humid (above 70%), sweat can't evaporate properly. Your hypothalamus (your body's thermostat) reacts by producing even more sweat, trying to achieve a cooling effect that the air simply won't allow. For someone with hyperhidrosis, this creates a frustrating loop.`;
    } else if (isDietary) {
      insight = `What you've eaten or drunk is likely setting this off. Spicy foods contain compounds that trick your brain into thinking you're overheating, while caffeine dials up your body's baseline "alert" level, making your sweat glands much easier to trigger via the sympathetic nervous system.`;
    } else if (isPhysical) {
      insight = `Your body is being very efficient—perhaps too efficient—at cooling you down. In hyperhidrosis, the "dial" for sweat production is turned up much higher than average, so your sympathetic chain sends far more moisture signals than is actually needed.`;
    } else {
      insight = `This episode follows the typical pattern of primary focal hyperhidrosis, where specific areas like your ${areaList} sweat more than expected. It's essentially a minor "glitch" in the signal between your brain and your sweat glands, where the "on" switch is a bit too sensitive to daily life.`;
    }

    // Vasodilation-Edema Link
    let complicationInsight = '';
    if (hasAny(notesText, 'tight', 'swell', 'puffy', 'edema', 'tingle')) {
      complicationInsight = ` You mentioned a feeling of tightness or swelling; this is the 'Vasodilation-Edema Link.' The same signal that triggers sweat also opens up your blood vessels to release heat, which can cause fluid to build up temporarily in your hands or feet.`;
    }

    // Body area specifics
    const hasPalms = areas.some(a => a.includes('palm'));
    const hasSoles = areas.some(a => a.includes('sole') || a.includes('feet') || a.includes('foot'));
    const isPalmoplantar = hasPalms && hasSoles;
    const hasAxillae = areas.some(a => a.includes('arm') || a.includes('under'));
    const hasFace = areas.some(a => a.includes('face') || a.includes('scalp') || a.includes('head'));

    let areaInsight = '';
    if (isPalmoplantar) {
      areaInsight = ` Sweating on both your hands and feet is very common and is usually triggered more by your emotions and thoughts than by actual heat.`;
    } else if (hasPalms) {
      areaInsight = ` Hand sweating is a classic focal pattern, often driven by the sympathetic nervous system's reaction to social or work-related performance.`;
    } else if (hasAxillae) {
      areaInsight = ` Underarm sweating is a common focal pattern and responds very well to treatments that specifically block the acetylcholine signal at the local level.`;
    } else if (hasFace) {
      areaInsight = ` Facial sweating can be particularly tough because it's so visible, but it follows the same "sensitive signal" pattern as other areas.`;
    }

    return `${severityText}\n\n${insight}${complicationInsight}${areaInsight}`;
  }

  private buildReliefStrategies(ep: Episode): string[] {
    const strategies: string[] = [];
    const trigText = ep.triggers.map(t => lower(t.label || t.value || '')).join(' ');
    const isEmotional = hasAny(trigText, 'stress', 'anxiety', 'nervous', 'anger', 'anticipat', 'social', 'crowd');
    const isThermal = hasAny(trigText, 'hot', 'heat', 'humid', 'temperature', 'sun', 'warm');

    strategies.push(
      `The 4-7-8 Breathing Trick: Breathe in through your nose for 4 seconds, hold it for 7, and exhale slowly through your mouth for 8. Doing this just 3 times can "reset" your nervous system by activating the Vagus Nerve, shifting you from "fight or flight" to "rest and digest."`
    );

    strategies.push(
      `Cold Wrist Rinse: Run cold water over your wrists for a few minutes. Your blood vessels are very close to the skin there, so this helps cool your entire body down quickly and tells your brain to ease up on the sweat production signal.`
    );

    if (isThermal) {
      strategies.push(
        `Get Air Moving: Find a fan or a breeze. When it's humid, your sweat can't evaporate on its own, so moving air is your best friend to help that moisture actually do its job of cooling you down.`
      );
    } else if (isEmotional) {
      strategies.push(
        `The 5-4-3-2-1 Grounding Method: Name 5 things you see, 4 you can touch, 3 you hear, 2 you smell, and 1 you taste. This pulls your brain out of "stress mode" and can help stop the sweat-anxiety-sweat loop within about a minute.`
      );
    } else {
      strategies.push(
        `Rapid Cooling: Apply a cold drink or a wet towel to the back of your neck. This is one of your body's main "thermostats" and can help lower the sweat signal very quickly.`
      );
    }

    return strategies;
  }

  private buildTreatmentRecommendations(ep: Episode): string[] {
    const sev = ep.severityLevel;
    const areas = ep.bodyAreas.map(lower);
    const recs: string[] = [];

    if (sev >= 3) {
      recs.push(
        `Time for a Specialist: Since your sweating is significantly interfering with your life (Prescription Threshold Reached), it's worth seeing a dermatologist. They can offer prescription wipes (like Qbrexza), specialized gels (like Sofdra), or even Botox injections. These medical options work by "blocking the acetylcholine signal"—the chemical messenger that tells your glands to sweat.`
      );
      if (areas.some(a => a.includes('arm') || a.includes('under'))) {
        recs.push(
          `Permanent Options: For underarms, miraDry is a permanent solution that uses thermal energy to eliminate sweat glands. Since glands don't grow back, it's a one-time treatment for many warriors.`
        );
      }
      recs.push(
        `Iontophoresis (Water Treatment): This is highly effective for hands and feet, using a gentle electrical current in water to "quiet" the sweat glands. It works for about 80-90% of people who try it.`
      );
    } else {
      recs.push(
        `Clinical-Strength Antiperspirants: First-line treatments include aluminium chloride 20% (like Certain Dri). Apply to completely dry skin right before bed to allow the formula to block the sweat ducts while the glands are least active.`
      );
      recs.push(
        `Lifestyle Tweaks: Choose moisture-wicking fabrics (bamboo, merino wool, or athletic wear) instead of cotton. Cotton soaks up sweat and stays wet, which can actually make you feel colder and trigger more sweating.`
      );
    }

    return recs;
  }

  private buildLifestyleModifications(ep: Episode): string[] {
    const mods: string[] = [];
    const trigText = ep.triggers.map(t => lower(t.label || t.value || '')).join(' ');
    const notesText = lower(ep.notes || '');
    const isEmotional = hasAny(trigText, 'stress', 'anxiety', 'nervous', 'anger', 'anticipat', 'social');
    const isThermal = hasAny(trigText, 'hot', 'heat', 'humid', 'temperature', 'sun');
    const isDietary = hasAny(trigText, 'spicy', 'caffein', 'alcohol', 'hot drink');
    const hour = ep.datetime ? new Date(ep.datetime).getHours() : -1;
    const isMorning = hour >= 5 && hour < 12;

    if (isThermal) {
      mods.push(
        `Pre-Cooling: If you know you're heading into the heat, take a cool shower first. This lowers your body's internal temperature and gives you a much longer "buffer" before your sweat glands feel the need to kick in.`
      );
    }

    if (isEmotional) {
      mods.push(
        `Practice Your Reset: Try the 4-7-8 breathing exercises when you're not sweating. If your body is already familiar with the Vagus Nerve reset, it will work much faster when an episode actually starts.`
      );
    }

    if (isDietary) {
      mods.push(
        `Watch for Patterns: Keep an eye on which foods or drinks seem to push you over the edge. You might find that one coffee is fine, but a second cup is what triggers the sympathetic nervous system to over-fire.`
      );
    }

    if (isMorning) {
      mods.push(
        `Morning Routine: Your stress hormones (cortisol) naturally peak in the morning. Try building in 5 minutes of quiet time or breathing right after you wake up to help keep those levels steady.`
      );
    }

    mods.push(
      `Smart Fabrics: Choose fabrics that "wick" moisture away from your skin (like athletic wear, bamboo, or wool). Avoid cotton, which soaks up sweat and stays wet, often making the episode feel worse.`
    );

    return mods;
  }

  private buildMedicalAttention(ep: Episode): string {
    const sev = ep.severityLevel;

    const redFlags = "Keep an eye out for 'red flags' like drenching night sweats, sweating that only happens on one side of your body, or if this started very suddenly in adulthood. These can sometimes indicate secondary hyperhidrosis (SHH) which requires different medical investigation.";

    if (sev >= 3) {
      return `Because your sweating is frequently interfering with your daily life (Prescription Threshold Reached), I'd strongly recommend chatting with a dermatologist. You can show them your logs from this app to provide objective evidence of your HDSS level.\n\n${redFlags}`;
    }

    return `If your sweating starts to feel unmanageable or starts happening during your sleep, it's a good idea to check in with a healthcare provider.\n\n${redFlags}`;
  }

  private formatBodyAreas(areas: string[]): string {
    if (areas.length === 0) return 'unspecified areas';
    if (areas.length === 1) return areas[0];
    if (areas.length === 2) return `${areas[0]} and ${areas[1]}`;
    return `${areas.slice(0, -1).join(', ')}, and ${areas[areas.length - 1]}`;
  }
}

export const insightGenerator = new EpisodeInsightGenerator();

export function generateFallbackInsights(
  severity: number,
  bodyAreas: string[],
  triggers: Array<{ label: string; type: string; value?: string }>,
  notes?: string
): GeneratedInsights {
  return insightGenerator.generateCompleteInsight({
    severityLevel: severity,
    bodyAreas,
    triggers,
    notes,
  });
}
