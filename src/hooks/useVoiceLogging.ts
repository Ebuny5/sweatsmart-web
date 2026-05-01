import { useState, useEffect, useCallback, useRef } from "react";
import { BodyArea, Trigger } from "@/types";
import { BODY_AREA_OPTIONS, TRIGGER_GROUPS } from "@/constants/episodeData";
import { speakProfessionally, stopProfessionalSpeech } from "@/utils/webSpeechVoice";

type VoiceStage = "idle" | "listening" | "confirming" | "reasoning" | "saving";

interface VoiceMatches {
  bodyAreas: BodyArea[];
  triggers: Trigger[];
}

interface UseVoiceLoggingProps {
  onBodyAreaMatch: (area: BodyArea) => void;
  onTriggerMatch: (trigger: Trigger) => void;
  onTranscriptUpdate: (transcript: string) => void;
  onAutoSave: (finalTranscript?: string, matches?: VoiceMatches) => void;
  onUndo: () => void;
  isSubmitting: boolean;
}

const SILENCE_BEFORE_CONFIRM_MS = 4000;
const CONFIRMATION_TIMEOUT_MS = 5000;
const REASONING_DELAY_MS = 10000;

export const useVoiceLogging = ({
  onBodyAreaMatch,
  onTriggerMatch,
  onTranscriptUpdate,
  onAutoSave,
  onUndo,
  isSubmitting,
}: UseVoiceLoggingProps) => {
  const [voiceStage, setVoiceStage] = useState<VoiceStage>("idle");
  const [transcript, setTranscript] = useState("");
  const [highlightedAreas, setHighlightedAreas] = useState<BodyArea[]>([]);
  const [highlightedTriggers, setHighlightedTriggers] = useState<string[]>([]);
  const [canUndo, setCanUndo] = useState(false);

  const recognitionRef = useRef<any>(null);
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const confirmationTimerRef = useRef<NodeJS.Timeout | null>(null);
  const reasoningTimerRef = useRef<NodeJS.Timeout | null>(null);
  const undoTimerRef = useRef<NodeJS.Timeout | null>(null);
  const transcriptRef = useRef("");
  const processedTextRef = useRef("");
  const stageRef = useRef<VoiceStage>("idle");
  const matchedAreasRef = useRef<Set<BodyArea>>(new Set());
  const matchedTriggersRef = useRef<Map<string, Trigger>>(new Map());

  const setStage = useCallback((stage: VoiceStage) => {
    stageRef.current = stage;
    setVoiceStage(stage);
  }, []);

  const clearTimers = useCallback(() => {
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    if (confirmationTimerRef.current) clearTimeout(confirmationTimerRef.current);
    if (reasoningTimerRef.current) clearTimeout(reasoningTimerRef.current);
    silenceTimerRef.current = null;
    confirmationTimerRef.current = null;
    reasoningTimerRef.current = null;
  }, []);

  const speak = useCallback((text: string) => {
    void speakProfessionally(text);
  }, []);

  const stopRecognition = useCallback(() => {
    try {
      recognitionRef.current?.stop();
    } catch {
      /* ignore */
    }
  }, []);

  const finishAndSave = useCallback(() => {
    if (stageRef.current === "saving") return;
    clearTimers();
    stopRecognition();
    setStage("reasoning");

    reasoningTimerRef.current = setTimeout(() => {
      const finalTranscript = transcriptRef.current.trim();
      setStage("saving");
      speak("Saving episode");
      onAutoSave(finalTranscript, {
        bodyAreas: Array.from(matchedAreasRef.current),
        triggers: Array.from(matchedTriggersRef.current.values()),
      });

      setCanUndo(true);
      undoTimerRef.current = setTimeout(() => setCanUndo(false), 10000);
    }, REASONING_DELAY_MS);
  }, [clearTimers, onAutoSave, onTranscriptUpdate, setStage, speak, stopRecognition]);

  const askForConfirmation = useCallback(() => {
    if (stageRef.current !== "listening") return;
    clearTimers();
    setStage("confirming");
    speak("Is that all?");
    confirmationTimerRef.current = setTimeout(finishAndSave, CONFIRMATION_TIMEOUT_MS);
  }, [clearTimers, finishAndSave, setStage, speak]);

  const scheduleSilenceCheck = useCallback(() => {
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    silenceTimerRef.current = setTimeout(askForConfirmation, SILENCE_BEFORE_CONFIRM_MS);
  }, [askForConfirmation]);

  const processTranscript = useCallback((text: string) => {
    const lowerText = text.toLowerCase().trim();
    if (!lowerText || lowerText === processedTextRef.current) return;

    if (stageRef.current === "confirming") {
      if (/\b(yes|yeah|yep|that is all|that's all|save|done|finished)\b/.test(lowerText)) {
        finishAndSave();
        processedTextRef.current = lowerText;
        return;
      }
      if (/\b(no|not yet|continue|more)\b/.test(lowerText)) {
        clearTimers();
        setStage("listening");
        scheduleSilenceCheck();
      }
    }

    const negations = ["no", "not", "never", "didn't", "don't", "wasn't", "without", "hardly", "barely", "instead"];
    const words = lowerText.split(/\s+/);
    const isNegated = (keyword: string) => {
      const kwWords = keyword.toLowerCase().split(/\s+/);
      for (let i = 0; i <= words.length - kwWords.length; i++) {
        if (kwWords.every((word, index) => words[i + index] === word)) {
          const startSearch = Math.max(0, i - 6);
          for (let k = startSearch; k < i; k++) {
            if (negations.includes(words[k])) return true;
          }
        }
      }
      return false;
    };

    BODY_AREA_OPTIONS.forEach((option) => {
      const matchFound = option.keywords.some((kw) => lowerText.includes(kw.toLowerCase()));
      const negated = option.keywords.some((kw) => lowerText.includes(kw.toLowerCase()) && isNegated(kw));
      if (matchFound && !negated && !matchedAreasRef.current.has(option.area)) {
        matchedAreasRef.current.add(option.area);
        onBodyAreaMatch(option.area);
        setHighlightedAreas((prev) => [...new Set([...prev, option.area])]);
        setTimeout(() => setHighlightedAreas((prev) => prev.filter((area) => area !== option.area)), 2000);
      }
    });

    TRIGGER_GROUPS.forEach((group) => {
      group.triggers.forEach((triggerOption) => {
        const matchFound = triggerOption.keywords.some((kw) => lowerText.includes(kw.toLowerCase()));
        const negated = triggerOption.keywords.some((kw) => lowerText.includes(kw.toLowerCase()) && isNegated(kw));
        if (matchFound && !negated && !matchedTriggersRef.current.has(triggerOption.label)) {
          const trigger: Trigger = {
            id: `${Date.now()}-${triggerOption.label}`,
            name: triggerOption.label,
            label: triggerOption.label,
            value: triggerOption.label.toLowerCase().replace(/\s+/g, "_"),
            type: triggerOption.type,
            category: triggerOption.type,
            icon: triggerOption.emoji,
          };
          matchedTriggersRef.current.set(triggerOption.label, trigger);
          onTriggerMatch(trigger);
          setHighlightedTriggers((prev) => [...new Set([...prev, trigger.label])]);
          setTimeout(() => setHighlightedTriggers((prev) => prev.filter((label) => label !== trigger.label)), 2000);
        }
      });
    });

    if (lowerText.includes("save episode") || lowerText.includes("log this")) {
      finishAndSave();
    }

    if (canUndo && lowerText.includes("undo")) {
      onUndo();
      setCanUndo(false);
      speak("Episode deleted");
      if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
    }

    processedTextRef.current = lowerText;
  }, [canUndo, clearTimers, finishAndSave, onBodyAreaMatch, onTriggerMatch, onUndo, scheduleSilenceCheck, setStage, speak]);

  const stopListening = useCallback((isAutoSave = false) => {
    clearTimers();
    stopRecognition();
    setStage("idle");
    const finalTranscript = transcriptRef.current.trim();
    if (finalTranscript) onTranscriptUpdate(finalTranscript);
    if (isAutoSave) {
      onAutoSave(finalTranscript, {
        bodyAreas: Array.from(matchedAreasRef.current),
        triggers: Array.from(matchedTriggersRef.current.values()),
      });
    }
  }, [clearTimers, onAutoSave, onTranscriptUpdate, setStage, stopRecognition]);

  const startListening = useCallback(() => {
    if (isSubmitting) return;

    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    if (!SpeechRecognition) {
      alert("Voice logging is not supported in this browser. Please use Chrome or Safari.");
      return;
    }

    if (stageRef.current !== "idle") {
      stopListening();
      return;
    }

    stopProfessionalSpeech();
    transcriptRef.current = "";
    processedTextRef.current = "";
    matchedAreasRef.current = new Set();
    matchedTriggersRef.current = new Map();
    setTranscript("");

    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onresult = (event: any) => {
      let combined = "";
      for (let i = 0; i < event.results.length; i++) {
        combined += `${event.results[i][0].transcript} `;
      }
      combined = combined.trim();
      transcriptRef.current = combined;
      setTranscript(combined);
      processTranscript(combined);
      if (stageRef.current === "listening") scheduleSilenceCheck();
    };

    recognition.onend = () => {
      if (stageRef.current === "listening" || stageRef.current === "confirming") {
        try {
          recognition.start();
        } catch {
          setStage("idle");
        }
      }
    };

    recognition.onerror = (event: any) => {
      console.error("Speech recognition error", event.error);
      if (event.error !== "no-speech") setStage("idle");
    };

    recognition.start();
    setStage("listening");
    speak("I'm listening");
    scheduleSilenceCheck();
  }, [isSubmitting, processTranscript, scheduleSilenceCheck, setStage, speak, stopListening]);

  useEffect(() => {
    return () => {
      clearTimers();
      if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
      stopRecognition();
      stopProfessionalSpeech();
    };
  }, [clearTimers, stopRecognition]);

  return {
    isListening: voiceStage !== "idle",
    voiceStage,
    startListening,
    stopListening,
    transcript,
    highlightedAreas,
    highlightedTriggers,
    canUndo,
  };
};