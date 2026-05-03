import { useState, useEffect, useCallback, useRef } from "react";
import { BodyArea, Trigger } from "@/types";
import { BODY_AREA_OPTIONS, TRIGGER_GROUPS } from "@/constants/episodeData";

export type VoiceState = "idle" | "listening" | "waiting_confirmation" | "reasoning" | "saving";

interface UseVoiceLoggingProps {
  onBodyAreaMatch: (area: BodyArea) => void;
  onTriggerMatch: (trigger: Trigger) => void;
  onTranscriptUpdate: (transcript: string) => void;
  onAutoSave: (finalTranscript?: string, detectedAreas?: BodyArea[], detectedTriggers?: Trigger[]) => void;
  onUndo: () => void;
  isSubmitting: boolean;
}

export const useVoiceLogging = ({
  onBodyAreaMatch,
  onTriggerMatch,
  onTranscriptUpdate,
  onAutoSave,
  onUndo,
  isSubmitting,
}: UseVoiceLoggingProps) => {
  const [isListening, setIsListening] = useState(false);
  const [voiceState, setVoiceState] = useState<VoiceState>("idle");
  const [transcript, setTranscript] = useState("");
  const [highlightedAreas, setHighlightedAreas] = useState<BodyArea[]>([]);
  const [highlightedTriggers, setHighlightedTriggers] = useState<string[]>([]);
  const [canUndo, setCanUndo] = useState(false);

  const recognitionRef = useRef<any>(null);
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const reasoningTimerRef = useRef<NodeJS.Timeout | null>(null);
  const undoTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastProcessedTranscriptRef = useRef("");

  // Refs to avoid stale closures in recognition callbacks
  const transcriptRef = useRef("");
  const isListeningRef = useRef(false);
  const voiceStateRef = useRef<VoiceState>("idle");
  const onAutoSaveRef = useRef(onAutoSave);
  const onTranscriptUpdateRef = useRef(onTranscriptUpdate);
  const onBodyAreaMatchRef = useRef(onBodyAreaMatch);
  const onTriggerMatchRef = useRef(onTriggerMatch);

  useEffect(() => {
    onAutoSaveRef.current = onAutoSave;
    onTranscriptUpdateRef.current = onTranscriptUpdate;
    onBodyAreaMatchRef.current = onBodyAreaMatch;
    onTriggerMatchRef.current = onTriggerMatch;
  }, [onAutoSave, onTranscriptUpdate, onBodyAreaMatch, onTriggerMatch]);

  const speak = useCallback((text: string) => {
    const utterance = new SpeechSynthesisUtterance(text);
    // Try to find a natural female voice if possible
    let voices = window.speechSynthesis.getVoices();

    const trySpeak = () => {
      // Prioritize premium/natural sounding female voices
      const femaleVoice = voices.find(v =>
        (v.name.includes("Natural") || v.name.includes("Premium") || v.name.includes("Neural") || v.name.includes("Azure") || v.name.includes("Microsoft")) &&
        (v.name.includes("Female") || v.name.includes("Google US English") || v.name.includes("Samantha") || v.name.includes("Victoria") || v.name.includes("Ava"))
      ) || voices.find(v =>
        v.name.includes("Female") ||
        v.name.includes("Google US English") ||
        v.name.includes("Samantha") ||
        v.name.includes("Victoria") ||
        v.name.includes("Ava")
      );

      if (femaleVoice) {
        utterance.voice = femaleVoice;
        utterance.rate = 0.95; // Slightly slower for more professional tone
        utterance.pitch = 1.0;
      }
      window.speechSynthesis.speak(utterance);
    };

    if (voices.length === 0) {
      window.speechSynthesis.onvoiceschanged = () => {
        voices = window.speechSynthesis.getVoices();
        trySpeak();
      };
    } else {
      trySpeak();
    }
  }, []);

  const stopListening = useCallback((isAutoSave = false) => {
    console.log("Stopping listening. isAutoSave:", isAutoSave);
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        console.error("Error stopping recognition:", e);
      }
    }
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    if (reasoningTimerRef.current) clearTimeout(reasoningTimerRef.current);

    setIsListening(false);
    isListeningRef.current = false;
    setVoiceState("idle");
    voiceStateRef.current = "idle";

    const finalTranscript = transcriptRef.current.trim();
    if (finalTranscript) {
      onTranscriptUpdateRef.current(finalTranscript);
    }

    if (isAutoSave) {
      onAutoSaveRef.current(finalTranscript);
    }
  }, []);

  const processTranscript = useCallback((text: string) => {
    const lowerText = text.toLowerCase();
    const newWords = lowerText.replace(lastProcessedTranscriptRef.current, "").trim();
    if (!newWords) return;

    // Check for negations like "no", "not", "never", "didn't", "wasn't"
    const isNegated = (keyword: string) => {
      const negations = ["no", "not", "never", "didn't", "don't", "wasn't", "without", "hardly", "barely", "instead of", "rather than"];
      const words = lowerText.split(/\s+/);
      const kwWords = keyword.toLowerCase().split(/\s+/);

      // Find the starting index of the keyword sequence in the full text
      for (let i = 0; i <= words.length - kwWords.length; i++) {
        let match = true;
        for (let j = 0; j < kwWords.length; j++) {
          // Use startsWith/includes for better partial matching
          if (!words[i + j].includes(kwWords[j]) && !kwWords[j].includes(words[i + j])) {
            match = false;
            break;
          }
        }

        if (match) {
          // Check preceding 6 words for any negation or context-switching
          const startSearch = Math.max(0, i - 6);
          for (let k = startSearch; k < i; k++) {
            if (negations.includes(words[k])) return true;
          }

          // Also check for "but not" type structures
          if (i > 0 && words[i-1] === "not") return true;
        }
      }
      return false;
    };

    // Match Body Areas
    BODY_AREA_OPTIONS.forEach(option => {
      const matchFound = option.keywords.some(kw => lowerText.includes(kw.toLowerCase()));
      if (matchFound) {
        // Only trigger if it's NOT negated
        const negated = option.keywords.some(kw => lowerText.includes(kw.toLowerCase()) && isNegated(kw));

        if (!negated) {
          onBodyAreaMatch(option.area);
          setHighlightedAreas(prev => [...new Set([...prev, option.area])]);
          setTimeout(() => {
            setHighlightedAreas(prev => prev.filter(a => a !== option.area));
          }, 2000);
        }
      }
    });

    // Match Triggers
    TRIGGER_GROUPS.forEach(group => {
      group.triggers.forEach(triggerOption => {
        const matchFound = triggerOption.keywords.some(kw => lowerText.includes(kw.toLowerCase()));
        if (matchFound) {
          // Only trigger if it's NOT negated
          const negated = triggerOption.keywords.some(kw => lowerText.includes(kw.toLowerCase()) && isNegated(kw));

          if (!negated) {
            const trigger: Trigger = {
              id: `${Date.now()}`,
              name: triggerOption.label,
              label: triggerOption.label,
              value: triggerOption.label.toLowerCase().replace(/\s+/g, "_"),
              type: triggerOption.type,
              category: triggerOption.type,
              icon: triggerOption.emoji,
            };
            onTriggerMatch(trigger);
            setHighlightedTriggers(prev => [...new Set([...prev, trigger.label])]);
            setTimeout(() => {
              setHighlightedTriggers(prev => prev.filter(t => t !== trigger.label));
            }, 2000);
          }
        }
      });
    });

    // Handle voice commands
    if (lowerText.includes("save episode") || lowerText.includes("log this")) {
      speak("Saving episode");
      stopListening(true);
    }

    if (voiceStateRef.current === "waiting_confirmation" && (lowerText.includes("yes") || lowerText.includes("yeah") || lowerText.includes("that's all") || lowerText.includes("all good"))) {
      startReasoningPhase();
    }

    if (canUndo && lowerText.includes("undo")) {
      onUndo();
      setCanUndo(false);
      speak("Episode deleted.");
      if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
    }

    lastProcessedTranscriptRef.current = lowerText;
  }, [onBodyAreaMatch, onTriggerMatch, onUndo, canUndo, speak, stopListening]);

  const startReasoningPhase = useCallback(async () => {
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);

    setVoiceState("reasoning");
    voiceStateRef.current = "reasoning";
    speak("Analysing your episode");

    // Artificial 10s reasoning feel as requested
    await new Promise(resolve => {
      reasoningTimerRef.current = setTimeout(resolve, 10000);
    });

    const lower = transcriptRef.current.toLowerCase();

    // ── BODY AREAS ──
    const detectedAreas: BodyArea[] = [];
    if (lower.includes('palm') || lower.includes('hand')) detectedAreas.push('palms');
    if (lower.includes('finger')) detectedAreas.push('fingers');
    if (lower.includes('sole') || lower.includes('bottom of')) detectedAreas.push('soles');
    if (lower.includes('feet') || lower.includes('foot')) detectedAreas.push('feet');
    if (lower.includes('toe')) detectedAreas.push('toes');
    if (lower.includes('feet and sole') || lower.includes('foot and sole')) detectedAreas.push('feet_soles');
    if ((lower.includes('face') && lower.includes('scalp')) || lower.includes('face and scalp')) detectedAreas.push('face_scalp');
    else if (lower.includes('face') || lower.includes('forehead') || lower.includes('cheek') || lower.includes('chin')) detectedAreas.push('face');
    else if (lower.includes('scalp') || (lower.includes('head') && !lower.includes('forehead'))) detectedAreas.push('scalp');
    if (lower.includes('underarm') || lower.includes('armpit')) detectedAreas.push('underarms');
    if (lower.includes('entire body') || lower.includes('whole body') || lower.includes('everywhere')) detectedAreas.push('entire_body');
    if (lower.includes('trunk') || lower.includes('torso') || lower.includes('stomach') || lower.includes('abdomen')) detectedAreas.push('trunk');
    if (lower.includes('chest')) detectedAreas.push('chest');
    if (lower.includes('back')) detectedAreas.push('back');
    if (lower.includes('groin')) detectedAreas.push('groin');

    if (detectedAreas.length === 0) detectedAreas.push('palms');

    // ── TRIGGERS ──
    const detectedTriggers: Trigger[] = [];
    const addTrigger = (label: string, value: string, type: string, emoji: string) => {
      detectedTriggers.push({
        id: `${Date.now()}-${value}`,
        name: label,
        label: label,
        value: value,
        type: type as any,
        category: type as any,
        icon: emoji
      });
    };

    if (lower.includes('hot') || lower.includes('heat') || lower.includes('warm') || lower.includes('temperature')) addTrigger("Hot Temperature", "hot_temperature", "environmental", "☀️");
    if (lower.includes('humid') || lower.includes('humidity') || lower.includes('muggy') || lower.includes('sticky')) addTrigger("High Humidity", "high_humidity", "environmental", "🌫️");
    if (lower.includes('crowd') || lower.includes('crowded') || lower.includes('busy place') || lower.includes('lots of people')) addTrigger("Crowded Spaces", "crowded_spaces", "environmental", "👥");
    if (lower.includes('bright light') || lower.includes('bright lights') || lower.includes('sunlight in eyes')) addTrigger("Bright Lights", "bright_lights", "environmental", "💡");
    if (lower.includes('loud') || lower.includes('noise') || lower.includes('noisy')) addTrigger("Loud Noises", "loud_noises", "environmental", "🔊");
    if (lower.includes('transitional') || lower.includes('temperature change') || lower.includes('moved from') || lower.includes('walked into') || lower.includes('came inside') || lower.includes('went outside')) addTrigger("Transitional Temperature", "transitional_temperature", "environmental", "🌡️");
    if (lower.includes('synthetic') || lower.includes('fabric') || lower.includes('polyester') || lower.includes('nylon')) addTrigger("Synthetic Fabrics", "synthetic_fabrics", "environmental", "👕");
    if (lower.includes('sun') || lower.includes('outdoor') || lower.includes('outside') || lower.includes('sunshine') || lower.includes('sunlight')) addTrigger("Outdoor Sun Exposure", "outdoor_sun_exposure", "environmental", "🏖️");

    if (lower.includes('stress') || lower.includes('stressed')) addTrigger("Stress", "stress", "emotional", "😫");
    if (lower.includes('anxi') || lower.includes('anxious') || lower.includes('anxiety')) addTrigger("Anxiety", "anxiety", "emotional", "😰");
    if (lower.includes('anticipat') || lower.includes('dreading') || lower.includes('worrying about sweating')) addTrigger("Anticipatory Sweating", "anticipatory_sweating", "emotional", "💭");
    if (lower.includes('embarrass')) addTrigger("Embarrassment", "embarrassment", "emotional", "😳");
    if (lower.includes('excite') || lower.includes('excited') || lower.includes('excitement')) addTrigger("Excitement", "excitement", "emotional", "⚡");
    if (lower.includes('anger') || lower.includes('angry') || lower.includes('frustrat')) addTrigger("Anger", "anger", "emotional", "😤");
    if (lower.includes('nervous') || lower.includes('nervousness') || lower.includes('nerves')) addTrigger("Nervousness", "nervousness", "emotional", "😬");
    if (lower.includes('public speak') || lower.includes('presentation') || lower.includes('speech') || lower.includes('speaking in front')) addTrigger("Public Speaking", "public_speaking", "emotional", "🎤");
    if (lower.includes('social') || lower.includes('party') || lower.includes('gathering') || lower.includes('event')) addTrigger("Social Interaction", "social_interaction", "emotional", "🤝");
    if (lower.includes('work pressure') || lower.includes('work stress') || lower.includes('boss') || lower.includes('deadline') || lower.includes('pressure at work')) addTrigger("Work Pressure", "work_pressure", "emotional", "📋");
    if (lower.includes('exam') || lower.includes('test') || lower.includes('interview')) addTrigger("Exam / Test Situation", "exam_test_situation", "emotional", "📝");

    if (lower.includes('spicy') || lower.includes('pepper') || lower.includes('chilli')) addTrigger("Spicy Food", "spicy_food", "dietary", "🌶️");
    if (lower.includes('caffeine') || lower.includes('coffee') || lower.includes('tea') || lower.includes('energy drink')) addTrigger("Caffeine", "caffeine", "dietary", "☕");
    if (lower.includes('alcohol') || lower.includes('drink') || lower.includes('beer') || lower.includes('wine')) addTrigger("Alcohol", "alcohol", "dietary", "🍷");
    if (lower.includes('hot drink') || lower.includes('hot beverage')) addTrigger("Hot Drinks", "hot_drinks", "dietary", "🍵");
    if (lower.includes('heavy meal') || lower.includes('big meal') || lower.includes('overate') || lower.includes('ate a lot')) addTrigger("Heavy Meals", "heavy_meals", "dietary", "🍽️");
    if (lower.includes('gustatory') || lower.includes('eating triggered') || lower.includes('after eating')) addTrigger("Gustatory Sweating", "gustatory_sweating", "dietary", "😋");

    if (lower.includes('exercise') || lower.includes('gym') || lower.includes('workout') || lower.includes('running') || lower.includes('sport') || lower.includes('walk')) addTrigger("Physical Exercise", "physical_exercise", "physical", "🏃");
    if (lower.includes('night sweat') || lower.includes('sweating at night') || lower.includes('woke up sweating')) addTrigger("Night Sweats", "night_sweats", "physical", "🌙");
    if (lower.includes('poor sleep') || lower.includes('bad sleep') || lower.includes('no sleep') || lower.includes('tired')) addTrigger("Poor Sleep", "poor_sleep", "physical", "😴");
    if (lower.includes('hormonal') || lower.includes('period') || lower.includes('menstrual') || lower.includes('menopause')) addTrigger("Hormonal Changes", "hormonal_changes", "physical", "🔄");
    if (lower.includes('ill') || lower.includes('sick') || lower.includes('fever') || lower.includes('infection')) addTrigger("Illness / Fever", "illness_fever", "physical", "🤒");
    if (lower.includes('hypoglycemia') || lower.includes('low blood sugar') || lower.includes('sugar dropped')) addTrigger("Hypoglycemia", "hypoglycemia", "physical", "🩸");
    if (lower.includes('clothing') || lower.includes('tight clothes') || lower.includes('uniform') || lower.includes('outfit')) addTrigger("Certain Clothing", "certain_clothing", "physical", "🧥");

    if (lower.includes('antidepressant') || lower.includes('ssri') || lower.includes('sertraline') || lower.includes('fluoxetine')) addTrigger("SSRIs / Antidepressants", "ssris_antidepressants", "physical", "💊");
    if (lower.includes('opioid') || lower.includes('pain medication') || lower.includes('morphine') || lower.includes('codeine')) addTrigger("Opioids / Pain Medication", "opioids_pain_medication", "physical", "💉");
    if (lower.includes('ibuprofen') || lower.includes('aspirin') || lower.includes('nsaid')) addTrigger("NSAIDs (Aspirin, Ibuprofen)", "nsaids", "physical", "🩺");
    if (lower.includes('blood pressure') || lower.includes('amlodipine') || lower.includes('lisinopril')) addTrigger("Blood Pressure Medication", "blood_pressure_medication", "physical", "❤️");
    if (lower.includes('insulin') || lower.includes('diabetes medication') || lower.includes('metformin')) addTrigger("Insulin / Diabetes Medication", "insulin_diabetes_medication", "physical", "🩸");
    if (lower.includes('supplement') || lower.includes('herbal') || lower.includes('vitamin')) addTrigger("Supplements / Herbal", "supplements_herbal", "physical", "🌿");
    if (lower.includes('new medication') || lower.includes('started taking') || lower.includes('new tablet') || lower.includes('new pill')) addTrigger("New Medication", "new_medication", "physical", "🔔");

    setVoiceState("saving");
    voiceStateRef.current = "saving";
    speak("Saving episode");

    // Pass everything back to the page
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
    }

    setIsListening(false);
    isListeningRef.current = false;
    setVoiceState("idle");
    voiceStateRef.current = "idle";

    onAutoSaveRef.current(transcriptRef.current, detectedAreas, detectedTriggers);
    setCanUndo(true);
    undoTimerRef.current = setTimeout(() => setCanUndo(false), 10000);
  }, [speak]);

  const startListening = useCallback(() => {
    if (isSubmitting) return;

    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    if (!SpeechRecognition) {
      alert("Voice logging is not supported in this browser. Please use Chrome or Safari.");
      return;
    }

    if (isListening) {
      stopListening();
      return;
    }

    recognitionRef.current = new SpeechRecognition();
    recognitionRef.current.continuous = true;
    recognitionRef.current.interimResults = true;
    recognitionRef.current.lang = "en-US";

    recognitionRef.current.onresult = (event: any) => {
      let currentTranscript = "";
      for (let i = 0; i < event.results.length; i++) {
        currentTranscript += event.results[i][0].transcript;
      }

      setTranscript(currentTranscript);
      transcriptRef.current = currentTranscript;
      processTranscript(currentTranscript);

      // Reset silence timer
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);

      // If we are already reasoning or saving, don't restart timers
      if (voiceStateRef.current === "reasoning" || voiceStateRef.current === "saving") return;

      if (voiceStateRef.current === "waiting_confirmation") {
        const lower = currentTranscript.toLowerCase().split(' ').pop() || "";
        if (lower.includes('no') || lower.includes('wait') || lower.includes('more') || lower.includes('hold')) {
          setVoiceState("listening");
          voiceStateRef.current = "listening";
          return;
        }

        // Restart the auto-proceed timer if they said something else
        silenceTimerRef.current = setTimeout(() => {
          startReasoningPhase();
        }, 3000);
        return;
      }

      silenceTimerRef.current = setTimeout(() => {
        if (voiceStateRef.current === "listening") {
          setVoiceState("waiting_confirmation");
          voiceStateRef.current = "waiting_confirmation";
          speak("Is that all?");

          // Wait 3 seconds for "no/wait/more" or proceed
          silenceTimerRef.current = setTimeout(() => {
            startReasoningPhase();
          }, 5000); // 5 seconds silence = done
        }
      }, 5000); // 5 seconds silence = ask confirmation
    };

    recognitionRef.current.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current.onerror = (event: any) => {
      console.error("Speech recognition error", event.error);
      setIsListening(false);
    };

    recognitionRef.current.start();
    setIsListening(true);
    isListeningRef.current = true;
    setVoiceState("listening");
    voiceStateRef.current = "listening";
    setTranscript("");
    transcriptRef.current = "";
    lastProcessedTranscriptRef.current = "";
    speak("I'm listening. Please explain your episode.");
  }, [isListening, isSubmitting, processTranscript, stopListening, speak, startReasoningPhase]);

  useEffect(() => {
    return () => {
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      if (reasoningTimerRef.current) clearTimeout(reasoningTimerRef.current);
      if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {}
      }
    };
  }, []);

  return {
    isListening,
    voiceState,
    startListening,
    stopListening,
    transcript,
    highlightedAreas,
    highlightedTriggers,
    canUndo,
  };
};
