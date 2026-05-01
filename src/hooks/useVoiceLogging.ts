import { useState, useEffect, useCallback, useRef } from "react";
import { BodyArea, Trigger } from "@/types";
import { BODY_AREA_OPTIONS, TRIGGER_GROUPS } from "@/constants/episodeData";

export type VoiceState = "idle" | "listening" | "waiting_confirmation" | "reasoning" | "saving";

interface UseVoiceLoggingProps {
  onBodyAreaMatch: (area: BodyArea) => void;
  onTriggerMatch: (trigger: Trigger) => void;
  onTranscriptUpdate: (transcript: string) => void;
  onAutoSave: (finalTranscript?: string) => void;
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

  const startReasoningPhase = useCallback(() => {
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);

    setVoiceState("reasoning");
    voiceStateRef.current = "reasoning";
    speak("Analysing your explanation... one moment.");

    reasoningTimerRef.current = setTimeout(() => {
      setVoiceState("saving");
      voiceStateRef.current = "saving";
      speak("Saving episode");
      stopListening(true);
      setCanUndo(true);
      undoTimerRef.current = setTimeout(() => setCanUndo(false), 10000);
    }, 10000); // 10 second reasoning phase
  }, [speak, stopListening]);

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

      silenceTimerRef.current = setTimeout(() => {
        if (voiceStateRef.current === "listening") {
          setVoiceState("waiting_confirmation");
          voiceStateRef.current = "waiting_confirmation";
          speak("Is that all?");

          // Wait another 5 seconds for "yes" or silence before auto-starting reasoning
          silenceTimerRef.current = setTimeout(() => {
            startReasoningPhase();
          }, 5000);
        }
      }, 4000); // Wait 4 seconds of silence to ask "Is that all?"
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
