/**
 * SweatSmart Recommendation Engine — v3 (Complete)
 * ─────────────────────────────────────────────────────────────────────────────
 * Covers every trigger category visible in the app:
 *   • Environment & Situation
 *   • Emotional & Cognitive
 *   • Food, Drink & Gustatory
 *   • Medications & Supplements
 *   • Physical Activity & Body State
 *
 * Body areas:
 *   Primary focal  — Palms, Feet & Soles, Armpits, Face & Scalp
 *   Secondary/truncal — Scalp Only, Chest, Back, Groin
 *
 * Key design rules:
 *   1. Only ever mention areas the user actually logged
 *   2. Every sentence is grounded in logged data — no knowledge-base bleed
 *   3. No raw jargon (acetylcholine, hypothalamus, sympathetic chain, etc.)
 *   4. Variation system: same episode pattern → different phrasing each time
 *   5. Medication triggers → flag for doctor, never just lifestyle advice
 *   6. Night sweats / hypoglycemia / illness → secondary concern pathway
 * ─────────────────────────────────────────────────────────────────────────────
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export interface TriggerInput {
  type: string;   // "environmental" | "emotional" | "food" | "medication" | "physical"
  value: string;  // machine key e.g. "hot_temperature", "stress", "ssri"
  label: string;  // display label e.g. "Hot Temperature", "SSRIs / Antidepressants"
}

export interface ClimateInput {
  temperature?: number;  // °C
  humidity?: number;     // %
  uvIndex?: number;
}

export interface EpisodeInput {
  severity: number;        // 1–5 (HDSS scale, app uses 1-4 mapped to 1-5)
  bodyAreas: string[];     // EXACTLY what the user tapped — never altered
  triggers: TriggerInput[];
  notes?: string;
  climate?: ClimateInput;
  variationSeed?: number;  // pass Date.now() or episode count for phrasing variety
}

export interface EpisodeInsights {
  clinicalAnalysis: string;
  immediateRelief: string[];        // exactly 3
  treatmentOptions: string[];       // exactly 2
  lifestyleModifications: string[]; // exactly 3
  medicalAttention: string;
}

// ─── Body area catalogues ─────────────────────────────────────────────────────
// Values must match BodyAreaSelector option labels (case-insensitive)

const PALMOPLANTAR_KEYS = new Set([
  "palms", "hands", "hand", "palm",
  "feet & soles", "feet", "soles", "foot", "sole",
  "fingers", "toes", "fingertips",
]);

const AXILLARY_KEYS = new Set([
  "armpits", "armpit", "underarms", "underarm", "axillae",
]);

const CRANIOFACIAL_KEYS = new Set([
  "face & scalp", "face", "scalp only", "scalp", "forehead",
  "head", "upper lip", "chin", "cheeks", "nose", "neck", "hairline",
]);

const TRUNCAL_KEYS = new Set([
  "back", "chest", "groin", "trunk", "abdomen",
  "stomach", "buttocks", "thighs", "torso",
  "whole body", "entire body",
]);

// ─── Pattern classifier ───────────────────────────────────────────────────────

type Pattern =
  | "palmoplantar"
  | "axillary"
  | "craniofacial"
  | "focal_mixed"        // palmoplantar + axillary
  | "multi_focal"        // 3 focal zones
  | "generalized"        // focal + truncal
  | "possible_secondary" // truncal dominant / whole body / medical triggers
  | "uncertain";

interface PatternResult {
  pattern: Pattern;
  hasPalmoplantar: boolean;
  hasAxillary: boolean;
  hasCraniofacial: boolean;
  hasTruncal: boolean;
  isPossibleSecondary: boolean;
  palmList: string[];
  axList: string[];
  facList: string[];
  truncList: string[];
  allAreas: string[]; // original user input — never modified
}

function classify(bodyAreas: string[]): PatternResult {
  const lc = bodyAreas.map(a => a.toLowerCase().trim());

  const palmList  = lc.filter(a => PALMOPLANTAR_KEYS.has(a));
  const axList    = lc.filter(a => AXILLARY_KEYS.has(a));
  const facList   = lc.filter(a => CRANIOFACIAL_KEYS.has(a));
  const truncList = lc.filter(a => TRUNCAL_KEYS.has(a));

  const hasPalmoplantar = palmList.length > 0;
  const hasAxillary     = axList.length > 0;
  const hasCraniofacial = facList.length > 0;
  const hasTruncal      = truncList.length > 0;

  const focalCount =
    (hasPalmoplantar ? 1 : 0) + (hasAxillary ? 1 : 0) + (hasCraniofacial ? 1 : 0);

  const isWholeBody       = lc.includes("whole body") || lc.includes("entire body");
  const isTruncalOnly     = hasTruncal && focalCount === 0;
  const isWidespread      = lc.length >= 5;
  const isPossibleSecondary = isWholeBody || isTruncalOnly || (hasTruncal && isWidespread);

  let pattern: Pattern;
  if (isPossibleSecondary)                     pattern = "possible_secondary";
  else if (hasTruncal && focalCount > 0)       pattern = "generalized";
  else if (focalCount >= 3)                    pattern = "multi_focal";
  else if (hasPalmoplantar && hasAxillary)     pattern = "focal_mixed";
  else if (hasPalmoplantar)                    pattern = "palmoplantar";
  else if (hasAxillary)                        pattern = "axillary";
  else if (hasCraniofacial)                    pattern = "craniofacial";
  else if (hasTruncal)                         pattern = "possible_secondary";
  else                                         pattern = "uncertain";

  return {
    pattern, hasPalmoplantar, hasAxillary, hasCraniofacial, hasTruncal,
    isPossibleSecondary, palmList, axList, facList, truncList,
    allAreas: bodyAreas,
  };
}

// ─── Severity ─────────────────────────────────────────────────────────────────

interface SeverityMeta {
  hdss: string;
  inline: string;      // short descriptor for inline use
  sentence: string;    // full sentence for clinical analysis
  isPresThreshold: boolean;
  isBotoxLevel: boolean;
}

function getSeverity(s: number): SeverityMeta {
  if (s <= 1) return {
    hdss: "HDSS 1",
    inline: "never noticeable and not yet interfering with daily life",
    sentence: "At your severity level (HDSS 1 — sweating that's barely noticeable and not yet getting in your way), you're in the best position to get ahead of this early.",
    isPresThreshold: false, isBotoxLevel: false,
  };
  if (s === 2) return {
    hdss: "HDSS 2",
    inline: "tolerable but sometimes getting in the way",
    sentence: "At your severity level (HDSS 2 — tolerable but sometimes getting in the way), this is the right time to act before things escalate.",
    isPresThreshold: false, isBotoxLevel: false,
  };
  if (s === 3) return {
    hdss: "HDSS 3",
    inline: "frequently interfering with daily activities",
    sentence: "At your severity level (HDSS 3 — sweating that frequently interferes with your daily life), this is the threshold where targeted treatment is both appropriate and worth pursuing.",
    isPresThreshold: true, isBotoxLevel: false,
  };
  if (s === 4) return {
    hdss: "HDSS 4",
    inline: "barely tolerable and significantly impacting quality of life",
    sentence: "At your severity level (HDSS 4 — barely tolerable and significantly impacting your quality of life), specialist treatment is genuinely worth prioritising now.",
    isPresThreshold: true, isBotoxLevel: true,
  };
  return {
    hdss: "HDSS 4",
    inline: "seriously affecting quality of life",
    sentence: "At your severity level (sweating that's seriously affecting your quality of life), this warrants attention — effective treatments exist and make a real difference.",
    isPresThreshold: true, isBotoxLevel: true,
  };
}

// ─── Trigger detection ────────────────────────────────────────────────────────

function has(t: TriggerInput[], ...keys: string[]): boolean {
  return t.some(tr => {
    const combined = `${tr.value} ${tr.label} ${tr.type}`.toLowerCase();
    return keys.some(k => combined.includes(k.toLowerCase()));
  });
}

// Trigger category detectors
const isEnv   = (t: TriggerInput[]) => t.some(tr => tr.type === "environmental" || [
  "hot temperature","high humidity","crowded spaces","bright lights","loud noises",
  "transitional temperature","synthetic fabrics","outdoor sun exposure",
].some(k => tr.label?.toLowerCase().includes(k.split(" ")[0].toLowerCase())));

const isEmot  = (t: TriggerInput[]) => t.some(tr => tr.type === "emotional" || [
  "stress","anxiety","anticipatory","embarrassment","excitement","anger",
  "nervousness","public speaking","social interaction","work pressure","exam",
].some(k => tr.label?.toLowerCase().includes(k)));

const isFood  = (t: TriggerInput[]) => t.some(tr => tr.type === "food" || [
  "spicy","caffeine","alcohol","hot drink","heavy meal","gustatory","energy drink",
].some(k => tr.label?.toLowerCase().includes(k)));

const isMeds  = (t: TriggerInput[]) => t.some(tr => tr.type === "medication" || [
  "ssri","antidepressant","opioid","pain medication","nsaid","aspirin","ibuprofen",
  "blood pressure","insulin","diabetes","supplement","herbal","new medication",
].some(k => tr.label?.toLowerCase().includes(k)));

const isPhys  = (t: TriggerInput[]) => t.some(tr => tr.type === "physical" || [
  "exercise","night sweat","poor sleep","hormonal","illness","fever",
  "hypoglycemia","certain clothing",
].some(k => tr.label?.toLowerCase().includes(k)));

// Specific high-priority flags
const hasNightSweat  = (t: TriggerInput[]) => has(t, "night sweat", "night_sweat", "nocturnal");
const hasHypogly     = (t: TriggerInput[]) => has(t, "hypoglycemia", "hypogly", "blood sugar");
const hasIllness     = (t: TriggerInput[]) => has(t, "illness", "fever", "sick");
const hasMedTrigger  = (t: TriggerInput[]) => isMeds(t);
const hasHormonal    = (t: TriggerInput[]) => has(t, "hormonal", "menstrual", "menopause", "hormone");
const hasPoorSleep   = (t: TriggerInput[]) => has(t, "poor sleep", "sleep");

// ─── Variation system ─────────────────────────────────────────────────────────
// Picks from multiple phrasings so repeated episodes never sound identical.

function pick<T>(arr: T[], seed: number): T {
  return arr[seed % arr.length];
}

// ─── Prose helpers ────────────────────────────────────────────────────────────

function areaPhrase(areas: string[]): string {
  const d = areas.map(a => a.toLowerCase());
  if (d.length === 1) return `your ${d[0]}`;
  if (d.length === 2) return `your ${d[0]} and ${d[1]}`;
  return `your ${d.slice(0, -1).join(", ")}, and ${d[d.length - 1]}`;
}

function triggerSummary(triggers: TriggerInput[], max = 3): string {
  const labels = triggers.map(t => t.label || t.value).filter(Boolean);
  if (!labels.length) return "";
  if (labels.length <= max) return labels.join(", ");
  return `${labels.slice(0, max).join(", ")}, and ${labels.length - max} more`;
}

// ─── CLINICAL ANALYSIS ────────────────────────────────────────────────────────

function buildClinical(
  p: PatternResult,
  sv: SeverityMeta,
  triggers: TriggerInput[],
  climate: ClimateInput | undefined,
  seed: number,
): string {
  const areas = areaPhrase(p.allAreas);
  const tsum  = triggerSummary(triggers);
  const tclause = tsum ? `, triggered by ${tsum},` : "";

  // ── Secondary concern check (overrides pattern framing)
  const medFlag    = hasMedTrigger(triggers);
  const nightFlag  = hasNightSweat(triggers);
  const hypoglyFlag = hasHypogly(triggers);
  const illnessFlag = hasIllness(triggers);
  const isSecondary = p.isPossibleSecondary || medFlag || nightFlag || hypoglyFlag || illnessFlag;

  // ── Opening sentence variants per pattern
  const openings: Record<Pattern, string[]> = {
    palmoplantar: [
      `This episode — affecting ${areas}${tclause} — fits the classic pattern of primary focal hyperhidrosis in the hands and feet. The sweating is specific, bilateral, and tied to clear triggers — all of which point firmly toward primary hyperhidrosis rather than anything systemic.`,
      `Affecting ${areas}${tclause}, this episode shows the hallmark focal pattern of palmoplantar hyperhidrosis. Specific, trigger-linked sweating concentrated in the hands and feet is exactly what primary hyperhidrosis looks like.`,
      `This episode in ${areas}${tclause} is a textbook focal pattern — bilateral, specific to the hands and feet, and linked to identifiable triggers. That combination is characteristic of primary hyperhidrosis.`,
    ],
    axillary: [
      `This episode — affecting ${areas}${tclause} — is consistent with primary focal axillary hyperhidrosis, one of the most common and well-studied patterns. It's also one of the most treatable.`,
      `Affecting ${areas}${tclause}, this is a typical axillary hyperhidrosis episode — focal, trigger-linked, and responding to the same treatment pathways that work well for this pattern.`,
      `This episode in ${areas}${tclause} follows the primary focal axillary pattern clearly. Localised underarm sweating driven by specific triggers is a well-understood presentation with effective treatment options.`,
    ],
    craniofacial: [
      `This episode — affecting ${areas}${tclause} — follows the pattern of primary focal craniofacial hyperhidrosis. This is particularly challenging because it's so visible, but it responds to specific treatments that work well in this area.`,
      `Affecting ${areas}${tclause}, this episode points to primary craniofacial hyperhidrosis. Visible facial sweating is one of the hardest patterns emotionally, but targeted treatment options exist specifically for this area.`,
      `This episode in ${areas}${tclause} is consistent with primary focal craniofacial hyperhidrosis — visible, trigger-driven, and very much treatable with the right approach.`,
    ],
    focal_mixed: [
      `This episode — affecting ${areas}${tclause} — shows a combined focal pattern that's common in primary hyperhidrosis: multiple specific zones reacting together when triggers align.`,
      `Affecting ${areas}${tclause}, this combined focal episode is a well-recognised pattern — primary hyperhidrosis often involves several focal areas responding simultaneously to the same triggers.`,
      `This episode across ${areas}${tclause} fits the multi-focal primary pattern. When both palmoplantar and axillary areas respond together, it confirms primary hyperhidrosis rather than pointing toward a secondary cause.`,
    ],
    multi_focal: [
      `This episode — affecting ${areas}${tclause} — spans several focal zones simultaneously, which is consistent with primary hyperhidrosis where multiple sites share the same overreactive sweat glands.`,
      `Affecting ${areas}${tclause}, this wide focal episode shows primary hyperhidrosis activating across multiple specific zones at once. The pattern is focal throughout, which is a key reassurance.`,
      `This episode across ${areas}${tclause} reflects multi-site primary hyperhidrosis. Seeing several focal areas react together is more common than most people realise and fits the primary pattern well.`,
    ],
    generalized: [
      `This episode — affecting ${areas}${tclause} — spans both focal zones and wider body areas. This broader pattern warrants a closer look to confirm whether it's primary hyperhidrosis affecting multiple sites or whether any underlying factor is contributing.`,
      `Affecting ${areas}${tclause}, this episode covers both typical focal areas and wider zones. It's worth understanding whether this is a primary multi-site pattern or something a GP should weigh in on.`,
      `This episode across ${areas}${tclause} shows a generalized spread alongside focal involvement. That combination is worth monitoring and discussing with a doctor when the pattern continues.`,
    ],
    possible_secondary: [
      `This episode — affecting ${areas}${tclause} — covers a broader area than the typical focal hyperhidrosis pattern. Widespread sweating like this has a wider range of possible causes and is worth a GP conversation to understand what's driving it.`,
      `Affecting ${areas}${tclause}, this episode extends beyond the usual focal zones. The broader spread means it's worth a medical check — not because it's necessarily serious, but because knowing the cause makes treatment far more effective.`,
      `This episode across ${areas}${tclause} is more widespread than typical primary focal hyperhidrosis. That's worth investigating with a doctor to confirm the pattern and find the most effective treatment path.`,
    ],
    uncertain: [
      `This episode — affecting ${areas}${tclause} — is an important data point. More logged episodes will build a clearer picture and unlock more targeted insights.`,
      `Affecting ${areas}${tclause}, this episode adds to your personal pattern history. With more logged data, the insights will become increasingly specific to your situation.`,
      `This episode in ${areas}${tclause} is worth tracking. As your episode log builds up, patterns emerge that unlock much more personalised recommendations.`,
    ],
  };

  const opening = pick(openings[p.pattern], seed);

  // ── Why these triggers cause sweating — plain language, no jargon
  const mechanismParts: string[] = [];

  if (has(triggers, "hot temperature", "heat", "warm", "temperature") ||
      (climate?.temperature && climate.temperature >= 27)) {
    mechanismParts.push(pick([
      "rising external temperature pushing your body's cooling system into overdrive",
      "heat telling your body it needs to cool down faster than usual, amplifying the sweat signal",
      "elevated temperature activating your cooling response more intensely than most people experience",
    ], seed));
  }
  if (has(triggers, "high humidity")) {
    mechanismParts.push("high humidity preventing sweat from evaporating, so your body keeps producing more in a continuous loop");
  }
  if (has(triggers, "transitional temperature")) {
    mechanismParts.push("sudden temperature shifts causing your body's heat-regulation to overreact as it tries to adjust quickly");
  }
  if (has(triggers, "outdoor sun", "sun exposure")) {
    mechanismParts.push("direct sun exposure raising skin temperature and UV load, both of which activate your cooling response");
  }
  if (has(triggers, "synthetic fabrics", "certain clothing")) {
    mechanismParts.push("non-breathable clothing trapping heat against the skin and continuously re-stimulating sweat glands");
  }
  if (has(triggers, "stress", "anxiety", "nervousness", "work pressure")) {
    mechanismParts.push(pick([
      "emotional pressure activating the same nerve pathway that controls sweating",
      "stress triggering the fight-or-flight response, which directly drives your sweat glands",
      "anxiety signalling your body to prepare for threat — a response that turns sweating up even when you're physically still",
    ], seed + 1));
  }
  if (has(triggers, "anticipatory sweating")) {
    mechanismParts.push("anticipating a situation causing a pre-emptive sweat response — your brain acts on expectation alone, before the situation even occurs");
  }
  if (has(triggers, "embarrassment", "anger", "excitement")) {
    mechanismParts.push("intense emotion activating the same nerve signals that heat uses — both pathways converge on the same sweat glands");
  }
  if (has(triggers, "public speaking", "social interaction", "exam", "test situation")) {
    mechanismParts.push("performance or social pressure creating a stress signal that feeds directly into the sweat pathway");
  }
  if (has(triggers, "crowded spaces")) {
    mechanismParts.push("crowded environments combining heat, sensory overload, and social pressure into a compounded trigger");
  }
  if (has(triggers, "bright lights")) {
    mechanismParts.push("bright light acting as a sensory stressor that activates the sweat response even without physical exertion");
  }
  if (has(triggers, "loud noises")) {
    mechanismParts.push("loud noise creating a low-level stress signal that drives the same pathway as emotional triggers");
  }
  if (isFood(triggers)) {
    if (has(triggers, "spicy food")) {
      mechanismParts.push("spicy food activating the same nerve receptors your body uses for heat detection — your sweat glands can't tell the difference");
    } else if (has(triggers, "caffeine", "energy drink")) {
      mechanismParts.push("caffeine stimulating your nervous system and lowering the threshold at which your sweat glands activate");
    } else if (has(triggers, "alcohol")) {
      mechanismParts.push("alcohol dilating blood vessels and raising skin temperature, which triggers the cooling response");
    } else if (has(triggers, "hot drink")) {
      mechanismParts.push("hot drinks raising your core temperature and triggering the heat-detection pathway");
    } else if (has(triggers, "heavy meal", "gustatory")) {
      mechanismParts.push("eating stimulating the digestive system in a way that can directly activate sweat glands — particularly in the face and neck");
    }
  }
  if (isPhys(triggers)) {
    if (has(triggers, "exercise", "physical activity")) {
      mechanismParts.push("physical exertion raising core temperature and triggering your cooling system — compounded by hyperhidrosis");
    }
    if (has(triggers, "poor sleep")) {
      mechanismParts.push("poor sleep lowering your body's stress resilience, making all your other triggers more reactive");
    }
    if (hasHormonal(triggers)) {
      mechanismParts.push("hormonal fluctuations shifting how sensitive your sweat glands are to everyday triggers");
    }
    if (hasIllness(triggers)) {
      mechanismParts.push("illness or fever causing your body's temperature control system to work harder than usual");
    }
    if (hasHypogly(triggers)) {
      mechanismParts.push("low blood sugar triggering a stress response that activates sweat glands as part of the body's emergency signal");
    }
  }
  if (isMeds(triggers)) {
    const medLabels = triggers
      .filter(t => isMeds([t]))
      .map(t => t.label || t.value)
      .join(", ");
    mechanismParts.push(`${medLabels} listed as a trigger — certain medications are a known cause of increased sweating as a direct side effect`);
  }

  const mechanismSentence = mechanismParts.length > 0
    ? pick([
        ` With hyperhidrosis, the sweat glands in these areas react far more intensely than needed — in this episode, driven by ${mechanismParts.slice(0, 3).join("; and ")}.`,
        ` In hyperhidrosis, your sweat glands overreact to signals that wouldn't cause noticeable sweating in most people — here, the key drivers were ${mechanismParts.slice(0, 3).join("; and ")}.`,
        ` The sweat glands in the affected areas are hyperreactive — in this episode that hyperreactivity was triggered by ${mechanismParts.slice(0, 3).join("; and ")}.`,
      ], seed + 2)
    : ` With hyperhidrosis, the sweat glands in these areas simply overreact to everyday signals — your body produces more sweat than the situation calls for.`;

  // ── Climate note
  let climateNote = "";
  if (climate?.temperature && climate.temperature >= 30 && climate?.humidity && climate.humidity >= 70) {
    climateNote = ` The conditions at the time — ${climate.temperature}°C and ${climate.humidity}% humidity — created a compounded load: your body was dealing with heat it couldn't efficiently release because the humid air slowed down evaporation.`;
  } else if (climate?.temperature && climate.temperature >= 30) {
    climateNote = ` Conditions at the time (${climate.temperature}°C) would have pushed the sweat response harder regardless — your body was dealing with a genuine thermal load on top of everything else.`;
  } else if (climate?.humidity && climate.humidity >= 75) {
    climateNote = ` The high humidity at the time (${climate.humidity}%) makes episodes harder to manage — sweat can't evaporate properly, so the cooling signal just keeps firing.`;
  }

  // ── Closing
  const closes = p.isPossibleSecondary || isSecondary
    ? [
        " Because this pattern covers a wider area, it's worth a GP conversation — in most cases there's no underlying cause, but ruling it out lets you focus on the right treatment.",
        " The broader pattern is worth discussing with a doctor. It's usually primary hyperhidrosis, but confirming that unlocks the most effective treatment path.",
        " A GP check is the sensible next step here — not because it's necessarily serious, but because understanding the cause leads to significantly better outcomes.",
      ]
    : sv.isBotoxLevel
    ? [
        " The good news: at your severity level, there are highly effective treatments available that make a real, lasting difference.",
        " Effective specialist treatment exists for your severity level — the trigger data you've logged makes the case for it clearly.",
        " Your identified triggers and severity level together point to specific treatments that work well. The data you've built up is genuinely useful here.",
      ]
    : [
        " The clear trigger picture gives you specific, concrete things to act on — both in the moment and over time.",
        " Having clear triggers identified is actually a useful position to be in — it means the management strategies are specific rather than generic.",
        " Knowing what's driving this gives you real leverage. Specific triggers mean specific solutions.",
      ];

  return `${opening}${mechanismSentence}${climateNote} ${sv.sentence} ${pick(closes, seed + 3)}`;
}

// ─── IMMEDIATE RELIEF ─────────────────────────────────────────────────────────

function buildRelief(
  p: PatternResult,
  triggers: TriggerInput[],
  climate: ClimateInput | undefined,
  seed: number,
): string[] {
  const items: string[] = [];
  const isHumid  = !!(climate?.humidity && climate.humidity >= 75);
  const isHot    = !!(climate?.temperature && climate.temperature >= 28);

  // ── Palmoplantar
  if (p.hasPalmoplantar) {
    items.push(pick([
      `Run cool (not ice-cold) water over your wrists and hands for 4–5 minutes. The blood vessels there sit very close to the surface — cooling them sends a rapid signal that your temperature is dropping, which dials back the sweat response in ${areaPhrase(p.palmList)} within minutes. It's discreet and works faster than most people expect.`,
      `Hold your wrists under cool running water for 4 minutes. Your body reads wrist temperature as a proxy for core temperature — cooling this area tells your heat-regulation system to ease up on the sweat signal, giving ${areaPhrase(p.palmList)} a chance to settle.`,
      `Cool ${areaPhrase(p.palmList)} and wrists under running water for 4–5 minutes. The large blood vessels near the wrist surface make this one of the fastest ways to communicate "cooling achieved" to your body, which reduces sweat production quickly.`,
    ], seed));
  }

  // ── Face / scalp
  if (p.hasCraniofacial) {
    items.push(pick([
      `Mist ${areaPhrase(p.facList)} with a cooling facial spray, or press a cool damp cloth to your forehead for 60 seconds. Lowering the skin temperature here sends a rapid cooling signal and reduces the drive to keep sweating. A small pocket spray is easy to carry and works even in public without drawing attention.`,
      `Apply a cool, damp cloth to ${areaPhrase(p.facList)} for 1–2 minutes. Facial skin cools quickly and sends a strong "temperature dropping" signal to your body. A small cooling spray in your bag is the discreet everyday version of this.`,
      `Use a cooling wipe or damp cloth on ${areaPhrase(p.facList)} — hold it there for a full minute. The face is one of the most responsive areas to topical cooling, and even a brief temperature drop can interrupt the sweat cycle effectively.`,
    ], seed + 1));
  }

  // ── Axillary
  if (p.hasAxillary) {
    items.push(pick([
      `Press a cool damp cloth or an unscented cooling wipe to your armpits for 2–3 minutes. This brings the local skin temperature down and gives the sweat glands a break. Unscented baby wipes kept cool in a small bag are a practical, discreet on-the-go option.`,
      `Cool your underarms with a damp cloth or cooling wipe held in place for 2 minutes. The temperature drop quietens the local sweat glands directly. Changing into a fresh layer immediately after amplifies the effect.`,
      `Apply a cool compress to your armpits for 2–3 minutes. Your sweat glands respond to local skin temperature — cooling the area directly interrupts the cycle faster than waiting for your overall body temperature to drop.`,
    ], seed + 1));
  }

  // ── Truncal / back / chest
  if (p.hasTruncal && !p.hasPalmoplantar && !p.hasAxillary) {
    items.push(pick([
      `Get airflow across ${areaPhrase(p.truncList)} immediately — a fan, open window, or any available breeze. ${isHumid ? "In high humidity, moving air is more effective than cooling because it actually evaporates the sweat rather than just lowering the temperature." : "Moving air helps sweat evaporate and tells your body the cooling is working, which dials back the signal to produce more."}`,
      `Move to a well-ventilated space and direct airflow across ${areaPhrase(p.truncList)}. Your body's cooling system relies on evaporation — once that's happening efficiently, the drive to keep sweating reduces significantly.`,
      `Find a fan or open a window and let air move across ${areaPhrase(p.truncList)}. ${isHumid ? "Humid air slows evaporation, but moving air forces it — this is the fastest way to break the cycle in these conditions." : "Airflow completes the cooling cycle your sweat started, signalling to your body that it can ease up."}`,
    ], seed + 1));
  }

  // ── Breathing for stress/emotional/social triggers
  if (isEmot(triggers) || has(triggers, "public speaking", "social", "crowd", "exam", "work pressure")) {
    items.push(pick([
      `Use the 4-7-8 breathing reset: in through your nose for 4 counts, hold for 7, out through your mouth for 8. Do this three times in a row. It activates the part of your nervous system that switches off the stress response — the exact mechanism driving stress-linked sweating — and most people feel the effect within about 90 seconds.`,
      `Try the 4-7-8 breath: inhale for 4, hold for 7, exhale for 8. Repeat three times. This directly counteracts the stress signal causing your sweating — your nervous system responds to this pattern by reducing the "alert" state that keeps sweat glands activated.`,
      `Do the 4-7-8 breathing technique right now: 4 in, hold 7, 8 out — three rounds. This isn't just relaxation; it's a direct physiological interrupt. Your nervous system reads this breathing pattern and starts pulling back the stress-driven sweat signal.`,
    ], seed + 2));
  }

  // ── Food trigger
  if (isFood(triggers) && items.length < 3) {
    items.push(pick([
      `Drink a glass of cool water slowly. If the trigger was spicy food or a hot drink, the goal is to lower your oral and stomach temperature quickly — this reduces the nerve stimulation that's driving the sweating. Avoid cold water in large gulps, which can cause a rebound response.`,
      `Sip cool (not ice-cold) water steadily. Food and drink triggers work through a nerve signal that responds to temperature and spice — cooling the stomach area gradually reduces that signal and helps the sweat response settle.`,
      `Have cool water and step away from the food or drink that triggered this. The gustatory sweat response runs through the same nerve pathway as heat — it will reduce once that stimulation is removed and your core temperature settles.`,
    ], seed + 2));
  }

  // ── Hypoglycemia
  if (hasHypogly(triggers) && items.length < 3) {
    items.push(
      `Address the blood sugar first: have 15–20g of fast-acting carbohydrate (glucose tablet, fruit juice, or regular soft drink) and wait 15 minutes. ` +
      `Sweating triggered by low blood sugar is your body's emergency signal — it will persist until blood sugar stabilises. ` +
      `The sweat is a symptom of the underlying state, so treating the sugar is more effective than any topical cooling.`
    );
  }

  // ── Illness/fever
  if (hasIllness(triggers) && items.length < 3) {
    items.push(
      `Rest in a cool, well-ventilated room and stay well-hydrated. ` +
      `Sweating during illness is part of your immune response — it's your body actively working. ` +
      `Cool (not cold) damp cloths on the forehead and wrists help manage comfort without suppressing the response, ` +
      `and keeping the room temperature moderate reduces the load on your temperature-regulation system.`
    );
  }

  // ── Medication trigger
  if (isMeds(triggers) && items.length < 3) {
    items.push(
      `For now, focus on keeping cool and dry with the same immediate techniques: cool wrists, good airflow, breathable clothing. ` +
      `Medication-induced sweating responds to the same immediate strategies, but the underlying cause requires a conversation with your prescribing doctor — ` +
      `there are often alternative formulations or additions to your regimen that can reduce this side effect significantly.`
    );
  }

  // ── Heat/climate fallback relief item
  if ((isHot || has(triggers, "heat", "hot temperature", "outdoor sun")) && items.length < 3) {
    items.push(pick([
      `Move to a cooler space immediately or create one: close blinds, switch on a fan. ${isHot ? `In today's heat (${climate?.temperature}°C), ` : ""}Your body will keep sweating until it reads that the temperature threat has resolved — removing the heat source is the fastest way to end the cycle.`,
      `Get out of the heat or reduce it in your environment. Your sweat glands will continue producing until the temperature signal stops — there's no shortcut more effective than actually lowering the heat load.`,
      `Reduce your heat exposure as quickly as possible. ${isHot ? `At ${climate?.temperature}°C, ` : ""}Even moving into shade or a cooler room makes a measurable difference within minutes, because the trigger is temperature itself.`,
    ], seed + 2));
  }

  // ── Universal fallback
  if (items.length < 3) {
    items.push(pick([
      `Change into a fresh layer of breathable fabric — bamboo, merino wool, or technical athletic material. Wet clothing keeps sending an "overheating" signal back to your body, which prolongs the episode. Removing it breaks the feedback loop and gives the sweat response room to settle.`,
      `Get into fresh, dry clothing in a breathable natural or wicking fabric. Damp fabric traps heat and moisture against the skin, continuously re-stimulating your sweat glands — changing removes that input immediately.`,
      `Switch to a fresh, breathable layer. Wet clothing is a continuous sweat trigger in itself — it holds heat and moisture against the very glands you're trying to calm. A dry wicking layer removes that stimulus entirely.`,
    ], seed + 3));
  }

  return items.slice(0, 3);
}

// ─── TREATMENT OPTIONS ────────────────────────────────────────────────────────

function buildTreatments(
  p: PatternResult,
  sv: SeverityMeta,
  triggers: TriggerInput[],
  seed: number,
): string[] {
  const options: string[] = [];
  const areaList = p.allAreas.join(", ");

  const hasMed  = hasMedTrigger(triggers);
  const hasNS   = hasNightSweat(triggers);
  const hasHG   = hasHypogly(triggers);
  const hasHorm = hasHormonal(triggers);
  const hasIll  = hasIllness(triggers);
  const hasSlp  = hasPoorSleep(triggers);

  // ── Medication-triggered sweating → refer first, treatments second
  if (hasMed) {
    const medLabels = triggers.filter(t => isMeds([t])).map(t => t.label).join(", ");
    options.push(
      `The most effective step here is a conversation with your prescribing doctor about the medication(s) listed as triggers (${medLabels}). ` +
      `Medication-induced sweating is a documented side effect — your doctor can explore dose adjustments, alternative formulations, or additions to your regimen that specifically reduce this. ` +
      `This is different from primary hyperhidrosis treatment and topical antiperspirants alone won't fully address a medication cause. ` +
      `Bring your SweatSmart episode log — it gives your doctor a clear picture of frequency and impact.`
    );
  }

  // ── Hypoglycemia → address the root cause
  if (hasHG) {
    options.push(
      `Hypoglycemia-linked sweating is your body's emergency low-sugar signal — it requires managing blood sugar stability rather than treating the sweating directly. ` +
      `If this is a recurring trigger, discuss with your GP or diabetes team: they can adjust your management plan to reduce hypoglycemic episodes, which will directly reduce these sweating episodes. ` +
      `In the meantime, keeping fast-acting glucose (tablets, juice) accessible at all times prevents the trigger from occurring in the first place.`
    );
  }

  // ── Night sweats → secondary concern
  if (hasNS && options.length < 2) {
    options.push(
      `Night sweats deserve their own conversation with a GP, separate from your daytime hyperhidrosis management. ` +
      `While they can be primary hyperhidrosis expressing at night, they can also have other causes — some of which are very straightforwardly treatable. ` +
      `When you see your GP, mention: "I have hyperhidrosis and I'm also experiencing night sweats — I'd like to rule out any secondary causes and discuss management options for both." ` +
      `Your SweatSmart log establishes the daytime pattern clearly, which makes the night sweat question easier to put in context.`
    );
  }

  // ── Hormonal → targeted options exist
  if (hasHorm && options.length < 2) {
    options.push(
      `Hormonally-triggered sweating has targeted treatment options beyond standard hyperhidrosis management. ` +
      `Depending on your specific situation (menstrual cycle pattern, perimenopause, or other hormonal factors), a GP can explore options including hormonal support, specific prescription treatments for sweating, or referral to a specialist. ` +
      `Tracking which cycle days produce episodes (use the notes field) gives a doctor valuable pattern data. ` +
      `Mention both the hyperhidrosis and the hormonal link explicitly in your appointment.`
    );
  }

  // ── Aluminium chloride — first line for focal patterns
  if ((p.hasPalmoplantar || p.hasAxillary) && options.length < 2) {
    const appNote = p.hasAxillary
      ? "Apply to completely dry underarms at bedtime — use a hairdryer on cool setting first — and wash off in the morning. Your sweat glands are less active overnight, so this is when it penetrates best."
      : "Apply to completely dry palms or soles at bedtime, cover loosely with thin cotton gloves or socks, and wash off in the morning.";

    const freq = sv.isPresThreshold
      ? "Start nightly for 2 weeks, then reduce to 2–3 nights a week once you see improvement."
      : "Most people see real improvement within 1–2 weeks of consistent use, then drop to every 2–3 nights for maintenance.";

    options.push(pick([
      `Clinical-strength aluminium chloride antiperspirant (20% concentration) — the right first-line treatment for your pattern and severity level. It works by gently blocking the opening of overactive sweat glands, significantly reducing output. ${appNote} ${freq} Look for products labelled "clinical strength" or marketed specifically for hyperhidrosis.`,
      `A 20% aluminium chloride antiperspirant is the evidence-backed starting point for your pattern. It forms a gentle plug in the sweat gland opening — no permanent change, but sustained and meaningful reduction in output. ${appNote} ${freq}`,
      `Start with a clinical-strength aluminium chloride product (20%). This is the most researched first-line treatment for ${p.hasAxillary ? "axillary" : "palmoplantar"} hyperhidrosis. ${appNote} ${freq} Standard antiperspirant won't be strong enough — look specifically for "hyperhidrosis" or "clinical strength" formulations.`,
    ], seed));
  }

  // ── Face only — different first line
  if (p.hasCraniofacial && !p.hasPalmoplantar && !p.hasAxillary && options.length < 2) {
    options.push(
      `Aluminium chloride can't be used on facial skin, so the treatment pathway is different. ` +
      `Glycopyrronium-based prescription wipes (Qbrexza) are specifically formulated for facial use and are available from a GP or dermatologist. ` +
      `They reduce the nerve signal that activates your sweat glands in that area. ` +
      `For higher severity, botulinum toxin injections in the forehead and scalp area are highly effective when administered by a trained practitioner.`
    );
  }

  // ── Iontophoresis for palmoplantar non-severe
  if (p.hasPalmoplantar && !sv.isBotoxLevel && options.length < 2) {
    options.push(pick([
      `A treatment using gentle electrical currents in water (iontophoresis) to temporarily quieten overactive sweat glands — highly effective specifically for hands and feet, with around 80–90% of people seeing clear improvement. You rest hands or feet in a shallow water tray for 20–30 minutes while a painless current passes through. Initial treatment: 3–4 sessions a week for 2–3 weeks. Home devices are available (£200–£500) and are much more cost-effective long-term than most alternatives at your level.`,
      `Iontophoresis — a treatment where gentle electrical currents in water calm overactive sweat glands — is particularly effective for the hands and feet. 3–4 sessions a week for a few weeks produces results for the majority of people who try it, then weekly maintenance keeps the effect going. Home devices make this practical and affordable long-term.`,
    ], seed + 1));
  }

  // ── Prescription topicals for HDSS 3
  if (sv.isPresThreshold && !sv.isBotoxLevel && options.length < 2) {
    options.push(pick([
      `Prescription-strength treatments — Qbrexza wipes or Sofdra gel — are appropriate at your severity level and go beyond what clinical-strength antiperspirant can do. They target the nerve signal activating your sweat glands rather than just the outlet. Ask your GP for a dermatology referral, or book directly — your episode log demonstrates the impact clearly. Most people see improvement within 2–4 weeks.`,
      `At HDSS 3, prescription topicals are clinically appropriate and worth pursuing. Qbrexza and Sofdra both work by reducing the activation signal to your sweat glands — a different mechanism to aluminium chloride and more effective for many people at your level. Your GP can prescribe these, and your SweatSmart log is strong supporting evidence.`,
    ], seed + 1));
  }

  // ── Botulinum toxin for HDSS 4+
  if (sv.isBotoxLevel && options.length < 2) {
    const botoxTarget = p.hasAxillary ? "underarms"
      : p.hasPalmoplantar ? (p.palmList.some(a => ["palms","hands"].includes(a)) ? "hands" : "feet")
      : p.hasCraniofacial ? "face and scalp"
      : areaList;

    options.push(pick([
      `Botulinum toxin (Botox) injections for your ${botoxTarget} — this is the most effective treatment at your severity level and worth prioritising, not delaying. It blocks the nerve signal to your sweat glands directly, giving most people 4–6 months of dramatically reduced sweating per session. Available via GP referral (NHS) or privately. Tell your GP: "I have hyperhidrosis at HDSS 4 severity affecting my ${botoxTarget} — I'd like to discuss botulinum toxin treatment." Your episode log supports the referral strongly.`,
      `Botulinum toxin for your ${botoxTarget} is the right treatment to pursue at your level. It's the most consistently effective option for HDSS 4 — blocking the nerve activation signal directly for 4–6 months per treatment. Ask your GP specifically for a dermatology referral for botulinum toxin, and bring your SweatSmart log to demonstrate severity and frequency.`,
    ], seed));

    if (options.length < 2) {
      options.push(
        `While arranging specialist treatment, prescription topicals — Qbrexza or Sofdra — can provide meaningful day-to-day relief in the short term and don't require a specialist referral. ` +
        `Your GP can prescribe these immediately. They're not a long-term substitute for botulinum toxin but they'll reduce the daily impact while you wait.`
      );
    }
  }

  // ── Secondary concern options
  if (p.isPossibleSecondary && options.length < 2) {
    options.push(
      `A GP visit is the right first step before focusing on specific treatment — a straightforward assessment confirms whether this is primary hyperhidrosis or whether an underlying factor needs addressing first. ` +
      `When you book, say: "I have excessive sweating affecting ${areaList} that's significantly impacting my life — I'd like to understand the cause and discuss treatment options." ` +
      `Bring your SweatSmart episode log. It gives the doctor objective frequency and severity data and saves time.`
    );
  }

  // ── Stress management as complementary second option
  if (isEmot(triggers) && options.length < 2) {
    options.push(pick([
      `Structured stress management as a complementary approach — not a standalone solution, but a reliable way to reduce the frequency and intensity of emotion-triggered episodes. Regular breathing practice (4-7-8 method), progressive muscle relaxation, or mindfulness gradually lowers your nervous system's baseline sensitivity. Think of it as making your emotional triggers less powerful rather than eliminating them.`,
      `Working on your stress response in a structured way reduces the emotional trigger's effectiveness. Consistent daily practice of the 4-7-8 breathing technique lowers your resting nervous system reactivity over weeks — so when a social or work pressure trigger occurs, your body's response is measurably less intense.`,
    ], seed + 1));
  }

  // ── Fallback
  while (options.length < 2) {
    options.push(
      `Continuing to log episodes consistently builds the foundation for clinical treatment conversations. ` +
      `Your episode history demonstrates pattern, frequency, and severity — three things your GP or dermatologist needs to match you to the right treatment. ` +
      `If you haven't yet tried clinical-strength aluminium chloride, that's the lowest-barrier, highest-evidence starting point for most focal hyperhidrosis patterns.`
    );
  }

  return options.slice(0, 2);
}

// ─── LIFESTYLE MODIFICATIONS ──────────────────────────────────────────────────

function buildLifestyle(
  p: PatternResult,
  triggers: TriggerInput[],
  climate: ClimateInput | undefined,
  seed: number,
): string[] {
  const mods: string[] = [];
  const isHot = !!(climate?.temperature && climate.temperature >= 28);

  // ── Fabric advice (area-specific)
  if (p.hasAxillary || p.hasTruncal) {
    mods.push(pick([
      `Switch clothing that sits against ${p.hasAxillary ? "your underarms and upper body" : areaPhrase(p.truncList)} to moisture-wicking fabrics — bamboo, merino wool, or technical athletic blends. Wet fabric against skin sends a continuous "still overheating" signal that prolongs episodes. Looser cuts in lighter colours also reduce heat absorption and give sweat glands less to react to.`,
      `Move to bamboo or merino wool for clothing against ${p.hasAxillary ? "your underarms and torso" : areaPhrase(p.truncList)}. These fabrics move moisture away from the skin rather than absorbing it — this breaks the feedback loop that keeps sweating going long after the trigger has passed.`,
      `Replace synthetic fabrics in clothing against ${p.hasAxillary ? "your upper body" : areaPhrase(p.truncList)} with breathable natural or wicking materials. Synthetic fibres trap heat and moisture, compounding every other trigger — it's one of the highest-leverage fabric changes you can make.`,
    ], seed));
  }

  if (p.palmList.some(a => ["soles","feet & soles","feet","foot","toes"].includes(a))) {
    mods.push(pick([
      `Move to bamboo or merino wool socks and carry a spare pair for midday changes. Damp socks create a continuous heat-and-moisture loop against your feet that keeps sweat glands activated. Open-toed footwear or leather soles whenever the situation allows — synthetic materials trap significantly more heat.`,
      `Switch to natural-fibre socks — bamboo is best for feet — and build in a midday sock change on warmer days. The combination of moisture and trapped heat in synthetic socks is a self-reinforcing trigger. A fresh pair breaks the cycle immediately.`,
    ], seed + 1));
  }

  // ── Heat / climate
  if (has(triggers, "hot temperature", "heat", "outdoor sun", "transitional temperature") || isHot) {
    mods.push(pick([
      `Use a pre-cooling strategy before situations you know will be warm: a cool shower or 10 minutes in air conditioning before going out gives your body a temperature buffer. Your sweat glands take longer to activate when you start at a lower core temperature, giving you a meaningful window before an episode builds. ${isHot ? "In conditions like today's, early morning or evening activity avoids the peak heat window entirely." : ""}`,
      `Pre-cool before warm environments: a cool shower or time in air conditioning before a heat exposure event lowers your starting temperature and delays when the sweat response kicks in. Carrying a small cooling spray extends that buffer further.`,
      `Build pre-cooling into your routine on days you know will be warm or before situations where heat is involved. Starting cool means it takes longer for your sweat threshold to be crossed — that extra time matters in social or professional settings.`,
    ], seed + 2));
  }

  // ── Transitional temperature
  if (has(triggers, "transitional temperature")) {
    mods.push(pick([
      `Slow down your temperature transitions where possible — take a few minutes at the threshold between environments (car park to office, outside to inside) rather than moving abruptly between very different temperatures. Gradual transitions give your body time to adjust without triggering a sudden sweat response.`,
      `Avoid abrupt hot-to-cold or cold-to-hot transitions. Stepping out of strong air conditioning into heat, or vice versa, can trigger an episode even when neither temperature alone would. When you can't avoid it, pause at the transition point for a minute to let your body start adjusting.`,
    ], seed));
  }

  // ── Emotional/social triggers
  if (isEmot(triggers) || has(triggers, "public speaking", "exam", "work pressure", "social interaction")) {
    mods.push(pick([
      `Build the 4-7-8 breathing technique into your daily routine — not just during episodes. Five minutes each morning over two to three weeks gradually lowers your nervous system's resting reactivity. Before high-pressure situations, two or three rounds beforehand can measurably reduce your body's response before any sweating starts.`,
      `Make breathing practice a daily habit rather than a crisis tool. The 4-7-8 technique (4 in, hold 7, 8 out) works better during episodes when your body already knows it. Daily practice builds the neural shortcut that makes it effective under pressure.`,
      `Use anticipatory preparation for situations you know trigger you — a few minutes of 4-7-8 breathing before a meeting, presentation, or social event reduces your starting stress level and gives your sweat glands less to react to when you walk in.`,
    ], seed + 1));
  }

  // ── Anticipatory sweating specific
  if (has(triggers, "anticipatory sweating")) {
    mods.push(pick([
      `For anticipatory sweating specifically, the trigger is expectation rather than the situation itself. Gradually exposing yourself to the triggering situation in low-stakes practice versions can reduce the anticipatory response over time. This is something a therapist or CBT practitioner can work through with you systematically — it's one of the more treatable aspects of hyperhidrosis.`,
      `Anticipatory sweating responds well to gradual exposure practice. Rehearsing the triggering situation in a lower-stakes way (practice presentations to a friend, for example) can retrain your body's anticipatory response over several weeks. This is also an area where CBT-based approaches have good evidence.`,
    ], seed));
  }

  // ── Food triggers
  if (isFood(triggers)) {
    if (has(triggers, "spicy food", "gustatory sweating")) {
      mods.push(pick([
        `Keep a food-episode diary for two weeks — note what you ate in the hour before each episode. Spicy food triggers the same temperature-detection pathway as heat, but the threshold varies significantly between people. Identifying your specific spice tolerance means you can make informed choices before events that matter, rather than cutting out food categories entirely.`,
        `Track food and episode timing for a few weeks using the notes field. Gustatory sweating (triggered by eating) often has a specific threshold — many people find they can tolerate moderate spice but have a clear line where it becomes a trigger. Finding that line is more practical than complete avoidance.`,
      ], seed));
    }
    if (has(triggers, "caffeine", "energy drink")) {
      mods.push(pick([
        `Consider shifting caffeine intake to mornings only, particularly on days with high-stakes situations. Caffeine lowers the threshold at which your sweat glands activate — it doesn't cause sweating directly, but it makes every other trigger more effective. Switching afternoon coffee to herbal tea is a small change with a meaningful cumulative effect.`,
        `Reduce caffeine on days where you know other triggers will be present — combining caffeine with heat, stress, or social pressure creates a compounded effect. Morning caffeine clears your system by early afternoon; cutting anything after midday gives you a cleaner window for the rest of the day.`,
      ], seed));
    }
    if (has(triggers, "alcohol")) {
      mods.push(pick([
        `Limit alcohol before situations you know are triggering — it dilates blood vessels and raises skin temperature, which lowers your sweat threshold even when you don't feel warm. One drink often has a minimal effect; the impact compounds with additional drinks, especially in already warm environments.`,
        `On days with heat, stress, or social pressure triggers, reducing or skipping alcohol removes one contributor from the stack. Alcohol's vasodilating effect raises your effective temperature — in combination with other triggers it can push you over the threshold more quickly than either would alone.`,
      ], seed));
    }
    if (has(triggers, "hot drink")) {
      mods.push(
        `Switching to cooler drinks in warm weather or before high-pressure situations reduces the thermal load on your system. ` +
        `Hot drinks raise your core temperature directly — in combination with environmental heat or emotional triggers they create a compounded effect. ` +
        `Iced or room-temperature versions of the same drinks work just as well and remove one input from the trigger stack.`
      );
    }
  }

  // ── Medications
  if (isMeds(triggers) && mods.length < 3) {
    mods.push(
      `Keep tracking which days medication-related sweating is more intense and note any pattern in the notes field (time after dose, specific activities). ` +
      `This data gives your prescribing doctor a clearer picture when you discuss adjustments. ` +
      `Some medications have extended-release or alternative formulations with fewer sweating side effects — but your doctor needs the episode pattern to make that recommendation confidently.`
    );
  }

  // ── Night sweats
  if (hasNightSweat(triggers) && mods.length < 3) {
    mods.push(
      `For night sweats specifically: keep your sleep environment cool (16–18°C if possible), use natural-fibre bedding (cotton or bamboo) that wicks moisture, and avoid alcohol within 3 hours of sleep. ` +
      `If you share a bed, a bedside fan directed at your side makes a significant practical difference. ` +
      `These adjustments reduce the intensity of night episodes while you pursue the medical conversation to identify whether there's an underlying trigger to address.`
    );
  }

  // ── Poor sleep
  if (hasPoorSleep(triggers) && mods.length < 3) {
    mods.push(
      `Poor sleep directly increases your sweating reactivity the following day — it lowers your stress threshold and makes every other trigger more effective. ` +
      `Treating sleep quality as part of your hyperhidrosis management (not just general health) is a legitimate strategy. ` +
      `A consistent sleep schedule, limiting screens after 9pm, and the pre-sleep breathing practice all improve baseline resilience. ` +
      `On nights after poor sleep, anticipate higher reactivity and plan mitigation accordingly.`
    );
  }

  // ── Hormonal
  if (hasHormonal(triggers) && mods.length < 3) {
    mods.push(
      `Track your episodes against your hormonal cycle using the notes field — note where you are in your cycle when logging. ` +
      `Hormonal hyperhidrosis often follows a predictable pattern once you can see it in the data. ` +
      `Knowing which days carry higher risk lets you schedule demanding social or professional situations around them, and gives a GP or specialist the pattern evidence they need to explore hormonal management options.`
    );
  }

  // ── Exercise
  if (has(triggers, "exercise", "physical exercise") && mods.length < 3) {
    mods.push(pick([
      `Schedule workouts for cooler parts of the day and prioritise well-ventilated environments. An active cool-down (5–10 minutes of walking after exercise) followed by a cool shower speeds your body's return to baseline. Staying hydrated throughout also matters — even mild dehydration makes sweat harder to evaporate and prolongs episodes.`,
      `Exercise timing makes a real difference: early morning or evening workouts avoid the peak heat window and reduce the combined load on your system. A cool shower immediately after exercise is more effective at ending the episode than letting the sweat dry — it actively lowers your core temperature rather than waiting for it to drop naturally.`,
    ], seed + 2));
  }

  // ── Illness
  if (hasIllness(triggers) && mods.length < 3) {
    mods.push(
      `During illness, sweating is your immune system doing its job — it's a normal response amplified by hyperhidrosis. ` +
      `Focus on staying cool and well-hydrated rather than trying to suppress the sweating. ` +
      `If sweating during illness is significantly worse than your baseline hyperhidrosis pattern, or if you experience unexplained fever sweats without illness, that's worth noting in your episode log and mentioning to your GP.`
    );
  }

  // ── Synthetic fabrics trigger
  if (has(triggers, "synthetic fabrics", "certain clothing") && mods.length < 3) {
    mods.push(
      `Audit your wardrobe for the items you wear most frequently and identify which are synthetic. ` +
      `You don't need to replace everything — focus on the layers closest to the affected areas. ` +
      `Bamboo and merino wool are the most effective natural alternatives: bamboo for warm climates (naturally cooling), merino for variable temperatures (regulates both ways). ` +
      `Even one or two key garment changes can have a significant impact on daily episode frequency.`
    );
  }

  // ── Logging habit (universal fallback)
  if (mods.length < 3) {
    mods.push(pick([
      `Keep logging consistently — after 10–15 episodes, patterns emerge that aren't visible from any single entry. Time of day, weather thresholds, trigger combinations that individually wouldn't matter. This data is also genuinely valuable in clinical appointments: it demonstrates severity and frequency objectively.`,
      `Use the notes field when logging to capture what you were doing and how you felt before and after. Context data builds a richer picture than episode data alone and often reveals triggers that aren't in the standard list.`,
      `Your episode log is building a personal trigger map over time. Consistent logging — even for mild episodes — gives the data the density it needs to show meaningful patterns. What you're building is the evidence base for your own treatment plan.`,
    ], seed + 3));
  }

  // ── Caffeine/alcohol general fallback
  if (mods.length < 3) {
    mods.push(pick([
      `Reduce caffeine in the afternoon and limit alcohol before situations you know are triggering. Both lower your sweat threshold when combined with other triggers — the effect is additive. Small adjustments on high-risk days are more sustainable than blanket elimination.`,
      `On days where your known triggers are likely (heat, stress, or social pressure), cutting caffeine after midday and limiting alcohol removes two factors from the stack. Neither is a primary cause, but both make every other trigger more effective.`,
    ], seed));
  }

  return mods.slice(0, 3);
}

// ─── MEDICAL ATTENTION ────────────────────────────────────────────────────────

function buildMedical(
  p: PatternResult,
  sv: SeverityMeta,
  triggers: TriggerInput[],
  seed: number,
): string {
  const areaList = p.allAreas.join(", ");
  const redFlags: string[] = [];

  if (p.isPossibleSecondary)    redFlags.push("the widespread pattern warrants ruling out any underlying cause");
  if (hasNightSweat(triggers))  redFlags.push("night sweats can have causes beyond hyperhidrosis that are worth investigating");
  if (hasHypogly(triggers))     redFlags.push("hypoglycemia as a trigger means blood sugar management is part of the picture");
  if (hasMedTrigger(triggers))  redFlags.push("medication-induced sweating needs a review with your prescribing doctor");
  if (hasIllness(triggers))     redFlags.push("illness-related sweating that's disproportionate to the illness itself is worth mentioning to a GP");
  if (hasHormonal(triggers))    redFlags.push("hormonal triggers have specific treatment pathways worth exploring");
  if (has(triggers, "sudden onset", "new onset", "recently started")) {
    redFlags.push("a sudden change in your sweating pattern always warrants a medical check");
  }

  if (redFlags.length > 0) {
    return pick([
      `A GP appointment is worth making here — ${redFlags.join("; and ")}. In most cases everything is fine, but confirming it means you can focus on the right treatment with confidence. When you book: "I have hyperhidrosis affecting ${areaList} and I'd like to discuss ${redFlags[0]} — I'd like to rule out any underlying causes and discuss treatment." Your SweatSmart episode log gives the doctor a clear picture immediately.`,
      `Book a GP appointment: ${redFlags.join("; and ")}. The conversation is usually straightforward, but it ensures your treatment is targeted at the actual cause. Say: "I have significant sweating affecting ${areaList} — I've been tracking it and I'd like to review ${redFlags.length > 1 ? "a few specific concerns" : redFlags[0]} and discuss next steps." Bring your episode log.`,
    ], seed);
  }

  if (sv.isBotoxLevel) {
    return pick([
      `At your severity level, a dermatologist referral is worth pursuing now — don't wait. When you see your GP: "I have hyperhidrosis at HDSS 4 severity affecting ${areaList} and it's significantly impacting my life. I'd like to discuss botulinum toxin treatment and a dermatology referral." Your episode log is strong supporting evidence for the referral.`,
      `HDSS 4 warrants specialist care. Ask your GP directly: "My hyperhidrosis is at HDSS 4 — affecting ${areaList} — and I'd like a dermatology referral specifically to discuss botulinum toxin treatment." If you've already tried clinical-strength antiperspirant, mention that too. Your SweatSmart log makes the case clearly.`,
    ], seed);
  }

  if (sv.isPresThreshold) {
    return pick([
      `No red flags here — the pattern is consistent with primary hyperhidrosis and your triggers are clear. If clinical-strength aluminium chloride doesn't improve things after 3–4 weeks of nightly use, see a GP or dermatologist and ask specifically about prescription options — Qbrexza or Sofdra for ${areaList}. At HDSS 3, prescription treatment is fully appropriate and your episode log supports the request.`,
      `No concerning flags in this episode. Pursue first-line treatment first (clinical-strength aluminium chloride for 3–4 weeks), then escalate to a GP if improvement isn't clear. At your severity level, prescription treatments are clinically appropriate — your SweatSmart log gives you objective data to back that request.`,
    ], seed);
  }

  return pick([
    `No red flags here — this pattern is consistent with primary hyperhidrosis and responds well to first-line approaches. If clinical-strength aluminium chloride doesn't show improvement after 3–4 weeks of consistent use, or if frequency or severity increases, that's the right point to see a GP. Keep logging — the data will make any clinical conversation much more productive.`,
    `Nothing in this episode points to a medical concern beyond primary hyperhidrosis. Continue with first-line management (clinical-strength aluminium chloride) and keep logging. If you're not seeing improvement after a month of consistent use, your episode history gives you everything a doctor needs to discuss next steps.`,
  ], seed);
}

// ─── MAIN ENTRY POINT ─────────────────────────────────────────────────────────

/**
 * generateEpisodeInsights
 *
 * Primary entry point. Pass it exactly what the user logged.
 * Returns fully personalised insights grounded only in that data.
 *
 * Pass variationSeed (e.g. Date.now() or episode count) to ensure
 * repeated similar episodes produce different phrasing.
 */
export function generateEpisodeInsights(input: EpisodeInput): EpisodeInsights {
  const {
    severity,
    bodyAreas,
    triggers = [],
    notes,
    climate,
    variationSeed = 0,
  } = input;

  const seed = variationSeed % 7; // 7 prevents mod-0 predictability

  if (!bodyAreas || bodyAreas.length === 0) {
    return buildEmptyResponse(seed);
  }

  const p  = classify(bodyAreas);
  const sv = getSeverity(severity);

  return {
    clinicalAnalysis:       buildClinical(p, sv, triggers, climate, seed),
    immediateRelief:        buildRelief(p, triggers, climate, seed),
    treatmentOptions:       buildTreatments(p, sv, triggers, seed),
    lifestyleModifications: buildLifestyle(p, triggers, climate, seed),
    medicalAttention:       buildMedical(p, sv, triggers, seed),
  };
}

/**
 * generateFallbackInsights
 *
 * Drop-in replacement for the existing generateFallbackInsights().
 * Identical call signature — zero changes needed in LogEpisode.tsx
 * beyond updating the import path.
 */
export function generateFallbackInsights(
  severity: number,
  bodyAreas: string[],
  triggers: TriggerInput[],
  notes?: string,
  climate?: ClimateInput,
): EpisodeInsights {
  // Use current timestamp as variation seed so each call gets different phrasing
  const variationSeed = typeof Date !== "undefined" ? Date.now() % 100 : 0;
  return generateEpisodeInsights({ severity, bodyAreas, triggers, notes, climate, variationSeed });
}

// ─── Empty areas fallback ─────────────────────────────────────────────────────

function buildEmptyResponse(seed: number): EpisodeInsights {
  return {
    clinicalAnalysis:
      "No body areas were recorded for this episode, so personalised analysis isn't possible. " +
      "Next time you log, tapping the affected areas will unlock insights specific to your pattern — " +
      "even selecting one area makes a significant difference to the quality of recommendations.",
    immediateRelief: [
      "Cool your wrists under running water for 4 minutes. The blood vessels there sit close to the surface — cooling them sends a rapid signal that dials back the sweat response across your whole body within minutes.",
      "Move to a well-ventilated space and let air circulate. Your body will keep sweating until it registers that cooling is happening — airflow is the fastest way to communicate that.",
      "Try the 4-7-8 breathing technique: breathe in for 4 counts, hold for 7, breathe out for 8 — repeat three times. This activates your body's calming response and can interrupt stress-driven sweating within 90 seconds.",
    ],
    treatmentOptions: [
      "Clinical-strength aluminium chloride antiperspirant (20% concentration) is the evidence-backed first-line treatment for most focal hyperhidrosis patterns. Apply to completely dry skin at bedtime and wash off in the morning.",
      "Log your next episode with body areas and triggers filled in — this unlocks treatment recommendations matched to your specific pattern and severity level.",
    ],
    lifestyleModifications: [
      "Wear moisture-wicking fabrics (bamboo, merino wool, or technical athletic blends) against the skin in the areas most affected. Wet fabric prolongs episodes by keeping heat and moisture in place.",
      "Log your next two or three episodes with body areas selected — after 5–10 complete entries, patterns emerge that unlock genuinely personalised insights.",
      "Note what you were doing and how you felt before each episode in the notes field. Context data often reveals triggers that aren't in the standard list and builds a richer personal picture.",
    ],
    medicalAttention:
      "No red flags identified. Completing future logs with body areas and triggers selected will make the medical attention guidance much more specific to your situation.",
  };
}
