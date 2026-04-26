import { useState, useEffect, useCallback, useRef } from "react";
import { BodyArea, Trigger } from "@/types";
import { BODY_AREA_OPTIONS, TRIGGER_GROUPS } from "@/constants/episodeData";

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
    const utterance = new SpeechSynthesisUtterance(text);
    // Try to find a natural female voice if possible
    let voices = window.speechSynthesis.getVoices();

    const trySpeak = () => {
      const femaleVoice = voices.find(v =>
        v.name.includes("Female") ||
        v.name.includes("Google US English") ||
        v.name.includes("Samantha") ||
        v.name.includes("Victoria")
      );
      if (femaleVoice) utterance.voice = femaleVoice;
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

    // Match Body Areas
    BODY_AREA_OPTIONS.forEach(option => {
      if (option.keywords.some(kw => lowerText.includes(kw))) {
        onBodyAreaMatch(option.area);
        setHighlightedAreas(prev => [...new Set([...prev, option.area])]);
        setTimeout(() => {
          setHighlightedAreas(prev => prev.filter(a => a !== option.area));
        }, 2000);
      }
    });

    // Match Triggers
    TRIGGER_GROUPS.forEach(group => {
      group.triggers.forEach(triggerOption => {
        if (triggerOption.keywords.some(kw => lowerText.includes(kw))) {
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
        speak("Saving episode...");
        stopListening(true);
        setCanUndo(true);
        undoTimerRef.current = setTimeout(() => setCanUndo(false), 10000);
      }, 5000);
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
