import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, X } from "lucide-react";
import { Trigger } from "@/types";

interface TriggerSelectorProps {
  triggers: Trigger[];
  onTriggersChange: (triggers: Trigger[]) => void;
}

type TriggerCategory = "environmental" | "emotional" | "dietary" | "physical";

interface TriggerOption {
  label: string;
  emoji: string;
  type: TriggerCategory;
  tip?: string; // clinical or community insight shown on selection
}

// ─── RESEARCH-BACKED TRIGGER TAXONOMY ─────────────────────────────────────────
// Sources: HDSS clinical guidelines, patient forums, dermatological studies
// as documented in SweatSmart UX Research v1
const triggerGroups: {
  category: TriggerCategory;
  title: string;
  categoryEmoji: string;
  researchNote: string;
  selectedBg: string;
  selectedBorder: string;
  triggers: Omit<TriggerOption, "type">[];
}[] = [
  // ── 1. ENVIRONMENTAL & SITUATIONAL ───────────────────────────────────────────
  {
    category: "environmental",
    title: "Environment & Situation",
    categoryEmoji: "🌡️",
    researchNote:
      "Physical + social environments combine to amplify sympathetic nervous system response",
    selectedBg: "bg-orange-50",
    selectedBorder: "border-orange-400",
    triggers: [
      {
        label: "Hot Temperature",
        emoji: "☀️",
        tip: "Direct heat activates eccrine glands across the body",
      },
      {
        label: "High Humidity",
        emoji: "🌫️",
        tip: "Evaporative cooling fails in humid air, worsening sweating",
      },
      {
        label: "Crowded Spaces",
        emoji: "👥",
        tip: "Combines ambient heat with social anxiety — a common hybrid trigger",
      },
      {
        label: "Bright Lights",
        emoji: "💡",
        tip: "Sensory overstimulation can activate the sympathetic nervous system",
      },
      {
        label: "Loud Noises",
        emoji: "🔊",
        tip: "Acoustic stress triggers CNS arousal and sweating response",
      },
      {
        label: "Transitional Temperature",
        emoji: "🌡️",
        tip: "Moving from AC to heat (or vice versa) rapidly can trigger an episode",
      },
      {
        label: "Synthetic Fabrics",
        emoji: "👕",
        tip: "Polyester and nylon trap heat and restrict evaporation",
      },
      {
        label: "Outdoor Sun Exposure",
        emoji: "🏖️",
        tip: "Radiant heat from sun exposure combined with UV stress",
      },
    ],
  },

  // ── 2. PSYCHOLOGICAL & COGNITIVE ─────────────────────────────────────────────
  {
    category: "emotional",
    title: "Emotional & Cognitive",
    categoryEmoji: "🧠",
    researchNote:
      "Emotional triggers initiate the sympathetic 'fight or flight' response. The 'anticipatory sweat' loop is a documented hyperhidrosis-specific feedback cycle.",
    selectedBg: "bg-purple-50",
    selectedBorder: "border-purple-400",
    triggers: [
      {
        label: "Stress / Anxiety",
        emoji: "😰",
        tip: "The most reported trigger — directly activates palmar and axillary eccrine glands",
      },
      {
        label: "Anticipatory Sweating",
        emoji: "💭",
        tip: "Thinking about sweating triggers the episode you feared — a feedback loop unique to hyperhidrosis",
      },
      {
        label: "Embarrassment",
        emoji: "😳",
        tip: "Social shame activates the sympathetic nervous system immediately",
      },
      {
        label: "Excitement",
        emoji: "⚡",
        tip: "Even positive excitement can trigger the same sympathetic pathway",
      },
      {
        label: "Anger",
        emoji: "😤",
        tip: "Emotional arousal elevates sympathetic tone and can trigger episodes",
      },
      {
        label: "Nervousness",
        emoji: "😬",
        tip: "Low-grade chronic nervousness sustains sweating even without a clear event",
      },
      {
        label: "Public Speaking",
        emoji: "🎤",
        tip: "Combines performance anxiety with social visibility — highly reported trigger",
      },
      {
        label: "Social Interaction",
        emoji: "🤝",
        tip: "Handshakes, meetings, physical proximity — especially problematic for palmar hyperhidrosis",
      },
      {
        label: "Work Pressure",
        emoji: "📋",
        tip: "Deadline stress and professional performance anxiety",
      },
      {
        label: "Exam / Test Situation",
        emoji: "📝",
        tip: "High-stakes performance environments with no escape option",
      },
    ],
  },

  // ── 3. DIETARY & GUSTATORY ───────────────────────────────────────────────────
  {
    category: "dietary",
    title: "Food, Drink & Gustatory",
    categoryEmoji: "🍽️",
    researchNote:
      "Gustatory sweating occurs when eating triggers sweating, beyond just spicy foods. Caffeine directly stimulates the sympathetic nervous system.",
    selectedBg: "bg-green-50",
    selectedBorder: "border-green-400",
    triggers: [
      {
        label: "Spicy Food",
        emoji: "🌶️",
        tip: "Capsaicin stimulates trigeminal nerve — a classic gustatory sweating trigger",
      },
      {
        label: "Caffeine",
        emoji: "☕",
        tip: "CNS stimulant — directly activates sympathetic nervous system, even in small amounts",
      },
      {
        label: "Alcohol",
        emoji: "🍷",
        tip: "Causes vasodilation and body temperature spike, worsening sweating",
      },
      {
        label: "Hot Drinks",
        emoji: "🍵",
        tip: "Raises core body temperature regardless of content",
      },
      {
        label: "Heavy Meals",
        emoji: "🍽️",
        tip: "Postprandial thermogenesis — digesting large meals generates internal heat",
      },
      {
        label: "Gustatory Sweating",
        emoji: "😋",
        tip: "Sweating triggered by eating in general, not a specific food — often linked to nerve damage",
      },
      {
        label: "Energy Drinks",
        emoji: "⚡",
        tip: "High caffeine + stimulant combinations amplify sympathetic response",
      },
    ],
  },

  // ── 4. PHARMACOLOGICAL ───────────────────────────────────────────────────────
  {
    category: "physical",
    title: "Medications & Supplements",
    categoryEmoji: "💊",
    researchNote:
      "Pharmacological triggers are a major cause of secondary hyperhidrosis. SSRIs, opioids, and NSAIDs all have excessive sweating as a documented side effect.",
    selectedBg: "bg-red-50",
    selectedBorder: "border-red-400",
    triggers: [
      {
        label: "SSRIs / Antidepressants",
        emoji: "💊",
        tip: "Serotonergic thermoregulatory disruption — one of the most common drug-induced causes",
      },
      {
        label: "Opioids / Pain Medication",
        emoji: "💉",
        tip: "Opioids directly stimulate sweat glands through CNS pathways",
      },
      {
        label: "NSAIDs (Aspirin, Ibuprofen)",
        emoji: "🩺",
        tip: "Common over-the-counter pain relievers with sweating as a documented side effect",
      },
      {
        label: "Blood Pressure Medication",
        emoji: "❤️",
        tip: "Beta-blockers and calcium channel blockers can cause hyperhidrosis as a side effect",
      },
      {
        label: "Insulin / Diabetes Medication",
        emoji: "🩸",
        tip: "Hypoglycemia episodes caused by insulin can trigger compensatory sweating",
      },
      {
        label: "Supplements / Herbal",
        emoji: "🌿",
        tip: "Some herbal supplements affect thermoregulation or hormone levels",
      },
      {
        label: "New Medication",
        emoji: "🔔",
        tip: "Starting a new medication — sweating is a common adjustment side effect",
      },
    ],
  },

  // ── 5. PHYSICAL & ACTIVITY ───────────────────────────────────────────────────
  {
    category: "physical",
    title: "Physical Activity & Body State",
    categoryEmoji: "🏃",
    researchNote:
      "Exercise-induced sweating is normal but can be disproportionate in hyperhidrosis. Sleep-associated sweating may indicate secondary (systemic) hyperhidrosis.",
    selectedBg: "bg-blue-50",
    selectedBorder: "border-blue-400",
    triggers: [
      {
        label: "Physical Exercise",
        emoji: "🏃",
        tip: "Exercise raises core body temperature — response is often far beyond what is needed",
      },
      {
        label: "Night Sweats",
        emoji: "🌙",
        tip: "Sweating during sleep may indicate secondary hyperhidrosis — consider sharing with your doctor",
      },
      {
        label: "Poor Sleep",
        emoji: "😴",
        tip: "Sleep deprivation heightens sympathetic nervous system sensitivity",
      },
      {
        label: "Hormonal Changes",
        emoji: "🔄",
        tip: "Menstruation, pregnancy, or menopause fluctuations can trigger or worsen episodes",
      },
      {
        label: "Illness / Fever",
        emoji: "🤒",
        tip: "Systemic illness increases sweating as part of immune response",
      },
      {
        label: "Hypoglycemia",
        emoji: "🩸",
        tip: "Low blood sugar triggers compensatory sweating — especially relevant if diabetic",
      },
      {
        label: "Certain Clothing",
        emoji: "🧥",
        tip: "Non-breathable or tight clothing traps heat against the skin",
      },
    ],
  },
];

// All predefined labels (to identify custom triggers)
const allPredefinedLabels = triggerGroups.flatMap((g) => g.triggers.map((t) => t.label));

const TriggerSelector: React.FC<TriggerSelectorProps> = ({
  triggers = [],
  onTriggersChange,
}) => {
  const [customTrigger, setCustomTrigger] = useState("");
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [activeTip, setActiveTip] = useState<string | null>(null);

  const isTriggerSelected = (label: string) =>
    Array.isArray(triggers) && triggers.some((t) => t.label === label);

  const handleTriggerToggle = (label: string, emoji: string, type: TriggerCategory, tip?: string) => {
    if (!Array.isArray(triggers)) return;

    if (isTriggerSelected(label)) {
      onTriggersChange(triggers.filter((t) => t.label !== label));
      if (activeTip === tip) setActiveTip(null);
    } else {
      const newTrigger: Trigger = {
        id: `${Date.now()}`,
        name: label,
        label,
        value: label.toLowerCase().replace(/\s+/g, "_"),
        type,
        category: type,
        icon: emoji,
      };
      onTriggersChange([...triggers, newTrigger]);
      if (tip) setActiveTip(tip);
    }
  };

  const handleAddCustomTrigger = () => {
    if (customTrigger.trim()) {
      const newTrigger: Trigger = {
        id: `${Date.now()}`,
        name: customTrigger.trim(),
        label: customTrigger.trim(),
        value: customTrigger.toLowerCase().replace(/\s+/g, "_"),
        type: "environmental",
        category: "environmental",
        icon: "✨",
      };
      onTriggersChange([...(triggers || []), newTrigger]);
      setCustomTrigger("");
      setShowCustomInput(false);
    }
  };

  const handleRemoveTrigger = (trigger: Trigger) => {
    if (!Array.isArray(triggers)) return;
    onTriggersChange(triggers.filter((t) => t.label !== trigger.label));
  };

  const customTriggers = Array.isArray(triggers)
    ? triggers.filter((t) => !allPredefinedLabels.includes(t.label))
    : [];

  return (
    <div className="space-y-7">
      <p className="text-sm text-muted-foreground">
        What may have caused or contributed to this episode? Select all that apply.
      </p>

      {triggerGroups.map((group) => (
        <div key={`${group.category}-${group.title}`} className="space-y-2">
          {/* Category header */}
          <div className="space-y-0.5">
            <h4 className="font-semibold text-sm text-gray-800 flex items-center gap-1.5">
              <span>{group.categoryEmoji}</span>
              {group.title}
            </h4>
            <p className="text-[11px] text-gray-400 leading-snug pl-5">
              {group.researchNote}
            </p>
          </div>

          {/* Flo-style pill grid */}
          <div className="flex flex-wrap gap-2 pt-1">
            {group.triggers.map((trigger) => {
              const isSelected = isTriggerSelected(trigger.label);
              return (
                <button
                  key={trigger.label}
                  type="button"
                  onClick={() =>
                    handleTriggerToggle(
                      trigger.label,
                      trigger.emoji,
                      group.category,
                      trigger.tip
                    )
                  }
                  className={`relative flex items-center gap-2 px-4 py-2.5 rounded-full border-2 transition-all duration-200 min-h-[48px]
                    ${
                      isSelected
                        ? `${group.selectedBg} ${group.selectedBorder} shadow-sm`
                        : "bg-gray-50 border-gray-200 hover:border-gray-300 hover:bg-gray-100"
                    }`}
                >
                  {isSelected && (
                    <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center shadow-sm">
                      <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                        <path
                          d="M1 4L3.5 6.5L9 1"
                          stroke="white"
                          strokeWidth="1.8"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </span>
                  )}
                  <span className="text-lg leading-none">{trigger.emoji}</span>
                  <span
                    className={`text-sm font-medium ${
                      isSelected ? "text-gray-900" : "text-gray-600"
                    }`}
                  >
                    {trigger.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      ))}

      {/* Clinical insight toast — shows tip of most recently selected trigger */}
      {activeTip && (
        <div className="flex items-start gap-3 rounded-xl bg-blue-50 border border-blue-100 p-4">
          <span className="text-xl mt-0.5">🔬</span>
          <div>
            <p className="text-xs font-semibold text-blue-700 mb-0.5">Why this trigger matters</p>
            <p className="text-sm text-gray-700 leading-snug">{activeTip}</p>
          </div>
          <button
            type="button"
            onClick={() => setActiveTip(null)}
            className="ml-auto text-gray-400 hover:text-gray-600 shrink-0"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Custom triggers */}
      {customTriggers.length > 0 && (
        <div className="space-y-2">
          <h4 className="font-semibold text-sm text-gray-700 flex items-center gap-1.5">
            <span>✨</span> Your Custom Triggers
          </h4>
          <div className="flex flex-wrap gap-2">
            {customTriggers.map((trigger, i) => (
              <div
                key={i}
                className="flex items-center gap-2 px-4 py-2.5 rounded-full border-2 bg-amber-50 border-amber-400 shadow-sm min-h-[48px]"
              >
                <span className="text-lg">✨</span>
                <span className="text-sm font-medium text-gray-800">{trigger.label}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveTrigger(trigger)}
                  className="ml-1 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add custom trigger */}
      <div>
        {showCustomInput ? (
          <div className="flex gap-2 items-center">
            <Input
              placeholder="e.g. coffee smell, bright sun, crowded lift..."
              value={customTrigger}
              onChange={(e) => setCustomTrigger(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAddCustomTrigger()}
              className="flex-1 rounded-full min-h-[48px] px-4"
              autoFocus
            />
            <Button
              type="button"
              onClick={handleAddCustomTrigger}
              disabled={!customTrigger.trim()}
              className="rounded-full min-h-[48px] px-5"
            >
              Add
            </Button>
            <button
              type="button"
              onClick={() => {
                setShowCustomInput(false);
                setCustomTrigger("");
              }}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setShowCustomInput(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-full border-2 border-dashed border-gray-300 text-gray-500 hover:border-gray-400 hover:text-gray-700 transition-all min-h-[48px]"
          >
            <Plus className="h-4 w-4" />
            <span className="text-sm font-medium">Add your own trigger</span>
          </button>
        )}
      </div>

      {/* Summary count */}
      {Array.isArray(triggers) && triggers.length > 0 && (
        <p className="text-xs text-blue-500">
          {triggers.length} trigger{triggers.length > 1 ? "s" : ""} logged for this episode
        </p>
      )}
    </div>
  );
};

export default TriggerSelector;
