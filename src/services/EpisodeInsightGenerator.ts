// Fallback AI Insight Generator - No API needed!
// This mimics Gemini's analysis using rule-based logic

interface Episode {
  severityLevel: number; // 1-5
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

class EpisodeInsightGenerator {
  
  // Clinical Analysis Generator
  generateClinicalAnalysis(episode: Episode): string {
    const severity = this.getSeverityDescription(episode.severityLevel);
    const bodyAreasText = this.formatBodyAreas(episode.bodyAreas);
    const triggerText = this.formatTriggers(episode.triggers);
    const pattern = this.identifyPattern(episode);
    
    return `This episode describes ${severity} focal hyperhidrosis affecting the ${bodyAreasText}. ${pattern} The identified triggers, ${triggerText}, are common precipitants for primary hyperhidrosis, as they can activate the sympathetic nervous system which controls sweat glands. The absence of symptoms like night sweats, sudden generalized onset, or other systemic issues further supports a primary diagnosis.`;
  }

  // Immediate Relief Strategies
  generateReliefStrategies(episode: Episode): string[] {
    const strategies: string[] = [];
    
    // Based on body areas
    if (episode.bodyAreas.includes('palms') || episode.bodyAreas.includes('soles')) {
      strategies.push("Apply an alcohol-based hand sanitizer or rubbing alcohol to palms and soles for rapid evaporation and temporary drying. This is effective due to alcohol's quick drying properties.");
      strategies.push("For palms and soles, wash affected areas with cool water and a mild soap, then thoroughly pat dry. Keep a spare pair of moisture-wicking socks (e.g., bamboo, merino wool) and change them immediately if feet become wet to prevent maceration and odor.");
    }
    
    if (episode.bodyAreas.includes('face') || episode.bodyAreas.includes('scalp')) {
      strategies.push("Use blotting papers, a clean soft cloth, or a cool, damp compress on the face to absorb sweat and provide localized cooling, reducing the perception of warmth and moisture.");
    }

    if (episode.bodyAreas.includes('underarms')) {
      strategies.push("Apply a clinical-strength antiperspirant to underarms. For immediate relief, use absorbent pads or dress shields to protect clothing. Consider wearing dark colors or patterns that hide sweat marks.");
    }

    if (episode.bodyAreas.includes('back') || episode.bodyAreas.includes('chest')) {
      strategies.push("Wear moisture-wicking undershirts made from bamboo or synthetic athletic fabrics. Keep a spare shirt for changing if needed. Use a personal fan or find air-conditioned environments.");
    }

    if (episode.bodyAreas.includes('groin')) {
      strategies.push("Wear breathable, moisture-wicking underwear. Apply talc-free body powder to reduce friction and absorb moisture. Choose loose-fitting pants or shorts when possible.");
    }
    
    // Based on triggers
    const hasEmotionalTrigger = episode.triggers.some(t => 
      t.label?.toLowerCase().includes('anger') || 
      t.label?.toLowerCase().includes('stress') || 
      t.label?.toLowerCase().includes('anxiety') ||
      t.type === 'emotional'
    );
    
    if (hasEmotionalTrigger) {
      strategies.push("When experiencing emotional triggers, immediately implement a brief deep diaphragmatic breathing exercise (e.g., 4-7-8 breathing) or a quick progressive muscle relaxation sequence. This can help to downregulate the sympathetic nervous system, potentially mitigating the intensity of the sweating response.");
    }

    const hasHeatTrigger = episode.triggers.some(t =>
      t.label?.toLowerCase().includes('hot') ||
      t.label?.toLowerCase().includes('heat') ||
      t.label?.toLowerCase().includes('temperature') ||
      t.label?.toLowerCase().includes('warm')
    );

    if (hasHeatTrigger) {
      strategies.push("Move to a cooler environment immediately. Use a portable fan, drink cold water, and apply cool compresses to pulse points (wrists, neck, temples) for rapid cooling.");
    }
    
    // Default strategies
    if (strategies.length === 0) {
      strategies.push("Stay in cool, well-ventilated areas and avoid tight-fitting clothing.");
      strategies.push("Use absorbent materials or antiperspirant wipes on affected areas.");
      strategies.push("Keep a small cooling towel or facial mist spray for quick relief when needed.");
    }
    
    return strategies;
  }

  // Treatment Recommendations
  generateTreatmentRecommendations(episode: Episode): string[] {
    const recommendations: string[] = [];
    
    // Based on severity
    if (episode.severityLevel >= 4) {
      recommendations.push("**Topical Antiperspirants (Aluminum Chloride)**: For affected areas, prescription-strength aluminum chloride solutions (e.g., Drysol, Certain Dri Clinical Strength) applied nightly to dry skin can effectively block sweat ducts. Start with a lower concentration and gradually increase if needed, to minimize skin irritation.");
      
      recommendations.push("**Iontophoresis**: This non-invasive treatment involves using a low-level electrical current to deliver ions into the sweat glands, temporarily blocking sweat production. It is highly effective for palmar and plantar hyperhidrosis and can be performed at home with a device.");

      recommendations.push("**Botulinum Toxin Injections**: For severe cases, botulinum toxin (Botox) injections can provide relief for 4-12 months by blocking the nerve signals that trigger sweat glands. This is particularly effective for underarms, palms, and soles.");
    }
    
    if (episode.bodyAreas.includes('face') || episode.bodyAreas.includes('scalp')) {
      recommendations.push("**Topical Glycopyrrolate Cream**: Specifically for facial sweating, a topical anticholinergic medication like Glycopyrrolate can be compounded or prescribed. It directly acts on muscarinic receptors in the sweat glands to reduce sweat production with fewer systemic side effects than oral anticholinergics.");
    }
    
    if (episode.severityLevel >= 3) {
      recommendations.push("**Oral Anticholinergics (e.g., Oxybutynin, Glycopyrrolate)**: If topical treatments or iontophoresis are insufficient for multiple affected areas, systemic anticholinergic medications can be considered. These reduce generalized sweat production by blocking acetylcholine receptors on sweat glands. Dosing is titrated to efficacy and tolerability of potential side effects like dry mouth, blurred vision, and constipation.");
    }

    if (episode.severityLevel >= 2) {
      recommendations.push("**Over-the-Counter Clinical Antiperspirants**: Products containing 10-15% aluminum chloride hexahydrate can be effective for mild to moderate cases. Apply to dry skin at bedtime and wash off in the morning.");
    }

    // Always include baseline recommendation
    if (recommendations.length === 0) {
      recommendations.push("**Regular Antiperspirant Use**: For mild hyperhidrosis, consistent use of clinical-strength over-the-counter antiperspirants can provide significant relief. Look for products with aluminum chloride or aluminum zirconium compounds.");
    }
    
    return recommendations;
  }

  // Lifestyle Modifications
  generateLifestyleModifications(episode: Episode): string[] {
    const modifications: string[] = [];
    
    // Based on triggers
    const triggerLabels = episode.triggers.map(t => (t.label || '').toLowerCase());
    
    if (triggerLabels.some(t => t.includes('stress') || t.includes('anxiety') || t.includes('anger')) || 
        episode.triggers.some(t => t.type === 'emotional')) {
      modifications.push("**Stress and Anxiety Management**: Practice regular stress-reduction techniques such as mindfulness meditation, yoga, or cognitive-behavioral therapy (CBT). Managing emotional triggers can significantly reduce episode frequency and intensity. Consider apps like Headspace or Calm for guided practices.");
    }
    
    if (triggerLabels.some(t => t.includes('hot') || t.includes('heat') || t.includes('temperature') || t.includes('warm'))) {
      modifications.push("**Temperature Management**: Avoid hot environments, use fans or air conditioning, wear breathable fabrics (cotton, linen, bamboo), and stay hydrated. Layer clothing so you can adjust to temperature changes. Plan outdoor activities during cooler parts of the day.");
    }
    
    if (triggerLabels.some(t => t.includes('exercise') || t.includes('physical') || t.includes('activity'))) {
      modifications.push("**Exercise Modifications**: Schedule physical activity during cooler parts of the day (early morning or evening). Exercise in air-conditioned environments when possible. Bring extra clothing and towels. Consider low-impact activities like swimming that keep you cool.");
    }
    
    if (triggerLabels.some(t => t.includes('food') || t.includes('spicy') || t.includes('caffeine') || t.includes('alcohol'))) {
      modifications.push("**Dietary Adjustments**: Identify and avoid dietary triggers such as spicy foods, caffeine, hot beverages, or alcohol that can stimulate sweating. Keep a food diary to track correlations between meals and episodes. Opt for cooling foods and stay well-hydrated with cold water.");
    }

    if (triggerLabels.some(t => t.includes('social') || t.includes('crowd') || t.includes('public') || t.includes('meeting'))) {
      modifications.push("**Social Situation Preparation**: Prepare for social events by applying antiperspirant beforehand, wearing breathable fabrics, and having a 'cooling down' strategy. Practice relaxation techniques to reduce anticipatory anxiety. Carry absorbent materials for quick touch-ups.");
    }
    
    // Always include general recommendations
    modifications.push("**Clothing Choices**: Wear moisture-wicking, breathable fabrics in light colors. Avoid synthetic materials that trap heat. Keep spare clothes available for changes during the day. Consider sweat-proof undershirts for professional settings.");
    
    modifications.push("**Hydration and Diet**: Drink plenty of cold water throughout the day. Avoid caffeine and alcohol, which can trigger sweating. Eat smaller, more frequent meals to reduce the thermic effect of food.");
    
    return modifications;
  }

  // When to Seek Medical Attention
  generateMedicalAttention(episode: Episode): string {
    const warnings: string[] = [];

    if (episode.severityLevel >= 4) {
      warnings.push("Your episode severity (${episode.severityLevel}/5) indicates significant impact on daily life.");
    }

    if (episode.bodyAreas.length >= 3) {
      warnings.push("Multiple body areas affected may indicate need for systemic treatment.");
    }

    const baseAdvice = "You should consult a dermatologist or healthcare provider if: (1) sweating significantly interferes with your daily activities, work, or social life; (2) you experience sudden changes in sweating patterns; (3) you have night sweats without obvious cause; (4) over-the-counter treatments haven't provided relief; or (5) sweating is accompanied by other symptoms like weight loss, fever, or rapid heartbeat.";

    if (warnings.length > 0) {
      return `${warnings.join(' ')} ${baseAdvice} Given the severity and pattern of your symptoms, scheduling an appointment with a dermatologist who specializes in hyperhidrosis would be beneficial.`;
    }

    return baseAdvice;
  }

  // Helper: Severity description
  private getSeverityDescription(level: number): string {
    const descriptions: Record<number, string> = {
      1: "very mild (1/5 severity)",
      2: "mild (2/5 severity)",
      3: "moderate (3/5 severity)",
      4: "severe (4/5 severity)",
      5: "very severe (5/5 severity)"
    };
    return descriptions[level] || "moderate (severity unspecified)";
  }

  // Helper: Format body areas
  private formatBodyAreas(areas: string[]): string {
    if (areas.length === 0) return "unspecified areas";
    if (areas.length === 1) return areas[0];
    if (areas.length === 2) return `${areas[0]} and ${areas[1]}`;
    
    const last = areas[areas.length - 1];
    const rest = areas.slice(0, -1).join(", ");
    return `${rest}, and ${last}`;
  }

  // Helper: Format triggers
  private formatTriggers(triggers: Array<{ label: string }>): string {
    if (triggers.length === 0) return "unspecified triggers";
    const labels = triggers.map(t => t.label).filter(Boolean);
    if (labels.length === 0) return "unspecified triggers";
    return labels.map(l => `'${l}'`).join(" and ");
  }

  // Helper: Identify pattern
  private identifyPattern(episode: Episode): string {
    const patterns: string[] = [];
    
    if (episode.bodyAreas.length === 1) {
      if (episode.bodyAreas.includes('palms')) {
        patterns.push("Isolated palmar hyperhidrosis is one of the most common forms, often beginning in childhood or adolescence. It is typically bilateral and symmetric, which is characteristic of primary focal hyperhidrosis.");
      } else if (episode.bodyAreas.includes('soles')) {
        patterns.push("Isolated plantar (sole) hyperhidrosis often occurs alongside palmar involvement and is characteristic of primary focal hyperhidrosis.");
      } else if (episode.bodyAreas.includes('underarms')) {
        patterns.push("Axillary (underarm) hyperhidrosis is extremely common and often responds well to topical treatments and botulinum toxin injections.");
      }
    } else if (episode.bodyAreas.includes('palms') && episode.bodyAreas.includes('soles')) {
      patterns.push("The combination of palmar and plantar hyperhidrosis (palmoplantar) is highly characteristic of primary focal hyperhidrosis, which typically manifests during childhood or adolescence.");
    } else if (episode.bodyAreas.length >= 3) {
      patterns.push("Multiple affected body areas suggest a more widespread manifestation of focal hyperhidrosis, which may benefit from systemic treatment approaches.");
    }
    
    return patterns.join(" ") || "The pattern of affected areas is consistent with primary focal hyperhidrosis.";
  }

  // Main function to generate complete insight (matches Gemini output format)
  generateCompleteInsight(episode: Episode): GeneratedInsights {
    return {
      clinicalAnalysis: this.generateClinicalAnalysis(episode),
      immediateRelief: this.generateReliefStrategies(episode),
      treatmentOptions: this.generateTreatmentRecommendations(episode),
      lifestyleModifications: this.generateLifestyleModifications(episode),
      medicalAttention: this.generateMedicalAttention(episode)
    };
  }
}

// Export singleton instance
export const insightGenerator = new EpisodeInsightGenerator();

// Helper function for direct use
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
    notes
  });
}
