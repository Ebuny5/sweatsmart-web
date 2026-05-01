import { useState, useEffect, useCallback, useRef } from "react";
import { BodyArea, Trigger } from "@/types";
import { BODY_AREA_OPTIONS, TRIGGER_GROUPS } from "@/constants/episodeData";
import { audioAlertPlayer } from "@/utils/audioAlertPlayer";

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
  const [transcript, setTranscript] = useState("");
  const [highlightedAreas, setHighlightedAreas] = useState<BodyArea[]>([]);
  const [highlightedTriggers, setHighlightedTriggers] = useState<string[]>([]);
  const [canUndo, setCanUndo] = useState(false);

  const recognitionRef = useRef<any>(null);
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const undoTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastProcessedTranscriptRef = useRef("");

  const speak = useCallback((text: string) => {
    // If it's a fixed phrase we have a professional recording for, use it
    if (text === "Time to check in" || text === "I'm listening") {
      audioAlertPlayer.playAlert("reminder").catch(console.error);
      return;
    }

    if (text === "Episode saved") {
      audioAlertPlayer.playAlert("checkin").catch(console.error);
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    // Try to find a natural female voice if possible
    let voices = window.speechSynthesis.getVoices();

    const trySpeak = () => {
      // Prioritize premium/natural sounding female voices
      const femaleVoice = voices.find(v =>
        (v.name.includes("Natural") || v.name.includes("Premium") || v.name.includes("Neural")) &&
        (v.name.includes("Female") || v.name.includes("Google US English") || v.name.includes("Samantha") || v.name.includes("Victoria"))
      ) || voices.find(v =>
        v.name.includes("Female") ||
        v.name.includes("Google US English") ||
        v.name.includes("Samantha") ||
        v.name.includes("Victoria")
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
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    setIsListening(false);

    const finalTranscript = transcript.trim();
    if (finalTranscript) {
      onTranscriptUpdate(finalTranscript);
    }

    if (isAutoSave) {
      onAutoSave(finalTranscript);
    }
  }, [transcript, onTranscriptUpdate, onAutoSave]);

  const processTranscript = useCallback((text: string) => {
    const lowerText = text.toLowerCase();
    const newWords = lowerText.replace(lastProcessedTranscriptRef.current, "").trim();
    if (!newWords) return;

    // Check for negations like "no", "not", "never", "didn't", "wasn't"
    const isNegated = (keyword: string) => {
      const negations = ["no", "not", "never", "didn't", "don't", "wasn't", "without", "hardly", "barely"];
      const words = lowerText.split(/\s+/);
      const kwWords = keyword.toLowerCase().split(/\s+/);

      // Find the starting index of the keyword sequence in the full text
      for (let i = 0; i <= words.length - kwWords.length; i++) {
        let match = true;
        for (let j = 0; j < kwWords.length; j++) {
          if (words[i + j] !== kwWords[j]) {
            match = false;
            break;
          }
        }

        if (match) {
          // Check preceding 5 words for any negation
          const startSearch = Math.max(0, i - 5);
          for (let k = startSearch; k < i; k++) {
            if (negations.includes(words[k])) return true;
          }
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
      speak("Saving episode...");
      stopListening(true);
    }

    if (canUndo && lowerText.includes("undo")) {
      onUndo();
      setCanUndo(false);
      speak("Episode deleted.");
      if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
    }

    lastProcessedTranscriptRef.current = lowerText;
  }, [onBodyAreaMatch, onTriggerMatch, onUndo, canUndo, speak, stopListening]);

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
      for (let i = event.resultIndex; i < event.results.length; i++) {
        currentTranscript += event.results[i][0].transcript;
      }

      setTranscript(currentTranscript);
      processTranscript(currentTranscript);

      // Reset silence timer
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = setTimeout(() => {
        speak("Episode saved");
        stopListening(true);
        setCanUndo(true);
        undoTimerRef.current = setTimeout(() => setCanUndo(false), 10000);
      }, 10000); // Increased to 10 seconds for more patience
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
    setTranscript("");
    lastProcessedTranscriptRef.current = "";
    speak("I'm listening");
  }, [isListening, isSubmitting, processTranscript, stopListening, speak]);

  useEffect(() => {
    return () => {
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
      if (recognitionRef.current) recognitionRef.current.stop();
    };
  }, []);

  return {
    isListening,
    startListening,
    stopListening,
    transcript,
    highlightedAreas,
    highlightedTriggers,
    canUndo,
  };
};
