/**
 * EpisodeInsightGenerator.ts
 * 
 * Friendly, plain-language insights for hyperhidrosis episodes.
 * Provides fallback analysis when the AI service is unavailable.
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
    const areaList = this.formatBodyAreas(ep.bodyAreas);

    // Classification
    const isNocturnal = hasAny(trigText, 'sleep', 'night');
    const isWidespread = ep.bodyAreas.length > 3;
    const classification = (isNocturnal || isWidespread)
      ? "This pattern shows signs of Secondary Generalized Hyperhidrosis (SHH), which can be triggered by systemic factors."
      : "This episode fits the criteria for Primary Focal Hyperhidrosis (PHH), where localized overactivity is the main driver.";

    // Probability & Pathway Mapping
    const isEmotional = hasAny(trigText, 'stress', 'anxiety', 'nervous', 'anger', 'anticipat', 'social', 'crowd', 'embarrass', 'exam', 'work pressure');
    const isThermal = hasAny(trigText, 'hot', 'heat', 'humid', 'temperature', 'sun', 'warm', 'outdoor');
    const amygdalaProb = isEmotional ? (isThermal ? 60 : 80) : 20;
    const hypothalamusProb = 100 - amygdalaProb;

    const mechanism = `Reasoning suggests this is ${amygdalaProb}% driven by the Amygdala (emotional response) and ${hypothalamusProb}% by the Hypothalamus (thermal load). Your Hypothalamus is sending a "start sweating" signal down the Sympathetic Chain—the nervous system's "software"—which is overdriving your functionally normal sweat glands.`;

    // Vasodilation Link
    const hasVasodilation = ep.notes && hasAny(lower(ep.notes), 'tight', 'swell', 'puff', 'expand');
    const vasodilationNote = hasVasodilation
      ? "\n\nNote: The 'tightness' or 'swelling' you're feeling is likely the Vasodilation-Edema Link—the same signal that triggers sweat also opens blood vessels, causing temporary fluid buildup."
      : "";

    // Friendly severity interpretation
    const severityText = sev >= 4
      ? 'Severe: sweating always interferes with your daily activities (HDSS 4)'
      : sev === 3
      ? 'Significant: sweating frequently interferes with your daily activities (HDSS 3)'
      : sev === 2
      ? 'Moderate: sweating sometimes interferes with your daily activities (HDSS 2)'
      : 'Mild: sweating rarely interferes with your daily activities (HDSS 1)';

    return `**Clinical Analysis: What This Means**\n\n**${severityText}**\n\n${classification}\n\n${mechanism}${vasodilationNote}`;
  }

  private buildReliefStrategies(ep: Episode): string[] {
    const strategies: string[] = [];
    const trigText = ep.triggers.map(t => lower(t.label || t.value || '')).join(' ');
    const isEmotional = hasAny(trigText, 'stress', 'anxiety', 'nervous', 'anger', 'anticipat', 'social', 'crowd');
    const isThermal = hasAny(trigText, 'hot', 'heat', 'humid', 'temperature', 'sun', 'warm');

    strategies.push(
      `**The 4-7-8 Breathing Trick:** Breathe in through your nose for 4 seconds, hold it for 7, and exhale slowly through your mouth for 8. This activates your Vagus Nerve to shift your body from "fight or flight" to "rest and digest," reducing the acetylcholine signal sent to your sweat glands.`
    );

    strategies.push(
      `**Cold Wrist Rinse:** Run cold water over your wrists for a few minutes. Your blood vessels are very close to the skin there, so this helps cool your entire body down quickly and tells your brain to ease up on the sweat production.`
    );

    if (isThermal) {
      strategies.push(
        `**Get Air Moving:** Find a fan or a breeze. When it's humid, your sweat can't evaporate on its own, so moving air is your best friend to help that moisture actually do its job of cooling you down.`
      );
    } else if (isEmotional) {
      strategies.push(
        `**The 5-4-3-2-1 Grounding Method:** Name 5 things you see, 4 you can touch, 3 you hear, 2 you smell, and 1 you taste. This pulls your brain out of "stress mode" and can help stop the sweat-anxiety-sweat loop within about a minute.`
      );
    } else {
      strategies.push(
        `**Rapid Cooling:** Apply a cold drink or a wet towel to the back of your neck. This is one of your body's main "thermostats" and can help lower the sweat signal very quickly.`
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
        `**Prescription Threshold Reached:** Since your severity is HDSS 3-4, it's time to discuss prescription options with a dermatologist. Treatments like Botox injections or topical gels (Sofdra, Qbrexza) work by 'blocking the acetylcholine signal' directly at the sweat glands.`
      );
      if (areas.some(a => a.includes('arm') || a.includes('under'))) {
        recs.push(
          `**Permanent Relief:** miraDry uses thermal energy to destroy underarm sweat glands permanently, providing a lasting solution for this severity level.`
        );
      }
      recs.push(
        `**Iontophoresis:** For hands and feet, this water-bath treatment uses gentle current to quieten overactive glands and has an 80-90% success rate.`
      );
    } else {
      recs.push(
        `**Aluminium Chloride 20%:** For HDSS 1-2, clinical-strength OTC antiperspirants are the first line of defense. Apply to completely dry skin at night to help plug the sweat ducts.`
      );
      recs.push(
        `**Behavioral Resets:** Focus on the 4-7-8 technique to manage the nervous system 'start' signal before it reaches your glands.`
      );
    }

    return recs;
  }

  private buildLifestyleModifications(ep: Episode): string[] {
    const mods: string[] = [];
    const trigText = ep.triggers.map(t => lower(t.label || t.value || '')).join(' ');
    const isEmotional = hasAny(trigText, 'stress', 'anxiety', 'nervous', 'anger', 'anticipat', 'social');
    const isThermal = hasAny(trigText, 'hot', 'heat', 'humid', 'temperature', 'sun');
    const isDietary = hasAny(trigText, 'spicy', 'caffein', 'alcohol', 'hot drink');
    const hour = ep.datetime ? new Date(ep.datetime).getHours() : -1;
    const isMorning = hour >= 5 && hour < 12;

    if (isThermal) {
      mods.push(
        `**Pre-Cooling:** If you know you're heading into the heat, take a cool shower first. This lowers your body's internal temperature and gives you a much longer "buffer" before your sweat glands feel the need to kick in.`
      );
    }

    if (isEmotional) {
      mods.push(
        `**Practice Your Reset:** Try those breathing exercises when you're *not* sweating. If your body is already familiar with them, they'll work much faster and more effectively when an episode actually starts.`
      );
    }

    if (isDietary) {
      mods.push(
        `**Watch for Patterns:** Keep an eye on exactly which foods or drinks seem to push you over the edge. You might find that a small coffee is fine, but a second cup is what starts the sweating.`
      );
    }

    if (isMorning) {
      mods.push(
        `**Morning Routine:** Your body's "stress hormones" naturally peak in the morning, which is why morning episodes are so common. Try to build in 5 minutes of quiet time or breathing right after you wake up to help keep those levels steady.`
      );
    }

    mods.push(
      `**Smart Fabrics:** Choose fabrics that "wick" moisture away from your skin (like athletic wear, bamboo, or wool). Avoid cotton, which soaks up sweat and stays wet, often making the episode feel worse.`
    );

    return mods;
  }

  private buildMedicalAttention(ep: Episode): string {
    const sev = ep.severityLevel;

    const redFlags = "Red Flags for SHH: Night sweats (soaking clothes/sheets), generalized sweating (entire body), or sudden onset after age 50 require medical escalation to rule out systemic conditions like thyroid issues.";

    if (sev >= 3) {
      return `Prescription Threshold Reached. Because your sweating frequently interferes with your life (HDSS 3-4), a dermatologist visit is indicated to discuss prescription options that block the acetylcholine signal.\n\n${redFlags}`;
    }

    return `If your sweating reaches HDSS 3 or you notice any red flags, please consult a healthcare provider for a clinical evaluation.\n\n${redFlags}`;
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
