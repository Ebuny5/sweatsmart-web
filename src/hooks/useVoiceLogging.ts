import { useState, useCallback, useRef, useEffect } from "react";
import { BodyArea, Trigger } from "@/types";
import { supabase } from "@/integrations/supabase/client";

/**
 * useVoiceLogging — Professional Audio + AssemblyAI Smart Loop
 *
 * Flow:
 *   1. User taps mic → play "I'm listening" → start recording
 *   2. Silence detected (~3s) → stop recording → play "Got it, anything else?"
 *   3. Listen 4s for yes/no:
 *        "no/wait/more/..."  → play "Go ahead" → resume recording, APPEND
 *        "yes/that's all"    → play "Saving your episode" → transcribe + extract tags
 *   4. Final transcript → AssemblyAI (whole session) → Gemini extract tags →
 *      onAnalysisComplete(bodyAreas, triggers, notes)
 */

export const isVoiceSupported = (): boolean => {
  if (typeof window === 'undefined') return false;
  const hasMedia = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
  const hasRecorder = typeof (window as any).MediaRecorder !== 'undefined';
  return hasMedia && hasRecorder;
};

export type VoiceStatus = 'LISTENING' | 'CONFIRMING' | 'REASONING' | 'SAVING' | null;

interface UseVoiceLoggingProps {
  onAnalysisComplete: (bodyAreas: BodyArea[], triggers: Trigger[], notes: string, severity?: number) => void;
}

const SOUND = {
  imListening: '/sounds/Im listening.mp3',
  gotItAnythingElse: '/sounds/Got it Anything else.mp3',
  goAhead: '/sounds/Go ahead.mp3',
  savingEpisode: '/sounds/saving your episode.mp3',
};

const SILENCE_HOLD_MS = 3000;     // hold silence this long to stop
const MIN_SPEECH_MS = 1200;       // require some speech before silence-stop fires

const AFFIRMATIVE_KEYWORDS = [
  'yes', 'yeah', 'yep', 'yup', 'sure', 'ok', 'okay', 'i have more', 'add more'
];

function playSound(src: string): Promise<void> {
  return new Promise((resolve) => {
    try {
      const a = new Audio(src);
      a.onended = () => resolve();
      a.onerror = () => resolve();
      a.play().catch(() => resolve());
      // safety timeout
      setTimeout(() => resolve(), 6000);
    } catch {
      resolve();
    }
  });
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = reject;
    r.readAsDataURL(blob);
  });
}

// ── Keyword fallback (used if Gemini extract fails) ────────────────────────
function fallbackExtract(text: string): { bodyAreas: BodyArea[]; triggers: string[] } {
  const lower = text.toLowerCase();
  const detectedAreas: BodyArea[] = [];
  if (lower.match(/\b(palm|palms|hand|hands)\b/)) detectedAreas.push('palms');
  if (lower.match(/\b(finger|fingers)\b/)) detectedAreas.push('fingers');
  if (lower.match(/\b(sole|soles)\b/)) detectedAreas.push('soles');
  if (lower.match(/\b(feet|foot)\b/)) detectedAreas.push('feet');
  if (lower.match(/\b(toe|toes)\b/)) detectedAreas.push('toes');
  if (lower.match(/\b(face|forehead|cheek|chin)\b/)) detectedAreas.push('face');
  if (lower.match(/\b(scalp|head)\b/) && !lower.includes('forehead')) detectedAreas.push('scalp');
  if (lower.match(/\b(underarm|armpit|armpits)\b/)) detectedAreas.push('underarms');
  if (lower.match(/\b(chest)\b/)) detectedAreas.push('chest');
  if (lower.match(/\b(back)\b/)) detectedAreas.push('back');
  if (lower.match(/\b(groin)\b/)) detectedAreas.push('groin');
  if (lower.match(/whole body|entire body|everywhere/)) detectedAreas.push('entire_body');
  if (detectedAreas.length === 0) detectedAreas.push('palms');

  const triggers: string[] = [];
  if (/\b(hot|heat|warm)\b/.test(lower)) triggers.push('hot_temperature');
  if (/\b(humid|humidity|muggy|sticky)\b/.test(lower)) triggers.push('high_humidity');
  if (/\b(stress|stressed)\b/.test(lower)) triggers.push('stress');
  if (/\b(anxi|anxious|anxiety)\b/.test(lower)) triggers.push('anxiety');
  if (/\b(nervous|nerves)\b/.test(lower)) triggers.push('nervousness');
  if (/\b(spicy|chilli|pepper)\b/.test(lower)) triggers.push('spicy_food');
  if (/\b(coffee|caffeine)\b/.test(lower)) triggers.push('caffeine');
  if (/\b(exercise|gym|workout|running|sport)\b/.test(lower)) triggers.push('physical_exercise');
  if (/\b(public speak|presentation|interview|exam)\b/.test(lower)) triggers.push('public_speaking');
  if (/\b(crowd|crowded)\b/.test(lower)) triggers.push('crowded_spaces');

  return { bodyAreas: Array.from(new Set(detectedAreas)), triggers: Array.from(new Set(triggers)) };
}

function valuesToTriggers(values: string[]): Trigger[] {
  return values.map((t) => ({
    id: `${Date.now()}-${t}`,
    name: t.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
    label: t.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
    value: t,
    type: 'environmental',
    category: 'environmental',
    icon: 'zap',
  }));
}

export const useVoiceLogging = ({ onAnalysisComplete }: UseVoiceLoggingProps) => {
  const [voiceStatus, setVoiceStatus] = useState<VoiceStatus>(null);
  const [voiceNotSupported, setVoiceNotSupported] = useState(!isVoiceSupported());
  const [transcript, setTranscript] = useState('');

  // refs
  const cancelledRef = useRef(false);
  const transcriptRef = useRef('');

  const fullStop = useCallback(() => {
    cancelledRef.current = true;
    setVoiceStatus(null);
    transcriptRef.current = '';
    setTranscript('');
  }, []);

  const recognizeSpeech = (): Promise<string> => {
    return new Promise((resolve) => {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (!SpeechRecognition) {
        console.error('SpeechRecognition not supported');
        return resolve('');
      }

      const recognition = new SpeechRecognition();
      recognition.lang = 'en-US';
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      let result = '';
      recognition.onresult = (event: any) => {
        result = event.results[0][0].transcript;
      };

      recognition.onend = () => resolve(result);
      recognition.onerror = (e: any) => {
        console.warn('Speech recognition error', e);
        resolve('');
      };

      recognition.start();
    });
  };

  // ── Main flow ─────────────────────────────────────────────────────────────
  const runFlow = useCallback(async () => {
    cancelledRef.current = false;
    transcriptRef.current = '';
    setTranscript('');

    // Step A: announce "I'm listening"
    setVoiceStatus('LISTENING');
    await playSound(SOUND.imListening);
    if (cancelledRef.current) return;

    let fullTranscript = '';

    // Loop: record → confirm → maybe go again
    while (!cancelledRef.current) {
      setVoiceStatus('LISTENING');
      const segment = await recognizeSpeech();
      if (cancelledRef.current) break;

      if (segment) {
        fullTranscript += (fullTranscript ? ' ' : '') + segment;
        setTranscript(fullTranscript);
        transcriptRef.current = fullTranscript;
      }

      // Ask "Got it, anything else?"
      setVoiceStatus('CONFIRMING');
      await playSound(SOUND.gotItAnythingElse);
      if (cancelledRef.current) break;

      // Listen for confirmation (Yes/No)
      const confirmation = await recognizeSpeech();
      if (cancelledRef.current) break;

      const lower = confirmation.toLowerCase().trim();
      console.log('[voice] confirm transcript:', lower);

      const isAffirmative = AFFIRMATIVE_KEYWORDS.some((k) => lower.includes(k));
      if (isAffirmative) {
        await playSound(SOUND.goAhead);
        if (cancelledRef.current) break;
        continue; // loop → record another segment
      }

      // Treat as "no / done" (default)
      break;
    }

    if (cancelledRef.current) {
      setVoiceStatus(null);
      return;
    }

    // Step D: Reasoning/Saving
    setVoiceStatus('SAVING');
    await playSound(SOUND.savingEpisode);

    if (!fullTranscript) {
      setVoiceStatus(null);
      onAnalysisComplete([], [], '');
      return;
    }

    setVoiceStatus('REASONING');

    // LLM extract tags (with keyword fallback)
    let bodyAreas: BodyArea[] = [];
    let triggerValues: string[] = [];
    let detectedSeverity: number | undefined;

    try {
      const { data } = await supabase.functions.invoke('voice-transcribe', {
        body: { mode: 'extract', text: fullTranscript },
      });
      const tags = data?.tags;
      if (tags?.body_areas?.length) bodyAreas = tags.body_areas as BodyArea[];
      if (tags?.triggers?.length) triggerValues = tags.triggers;
      if (tags?.severity) detectedSeverity = tags.severity;
    } catch (e) {
      console.warn('extract failed, falling back', e);
    }

    if (bodyAreas.length === 0 || triggerValues.length === 0) {
      const fb = fallbackExtract(fullTranscript);
      if (bodyAreas.length === 0) bodyAreas = fb.bodyAreas;
      if (triggerValues.length === 0) triggerValues = fb.triggers;
    }

    // Ensure we default to entire_body if nothing found
    if (bodyAreas.length === 0) bodyAreas = ['entire_body'];

    setVoiceStatus(null);
    onAnalysisComplete(
      Array.from(new Set(bodyAreas)),
      valuesToTriggers(triggerValues),
      fullTranscript.trim(),
      detectedSeverity
    );
  }, [onAnalysisComplete]);

  const startListening = useCallback(() => {
    if (voiceNotSupported) {
      console.warn('Voice not supported on this device');
      return;
    }
    if (voiceStatus !== null) return;
    runFlow();
  }, [runFlow, voiceNotSupported, voiceStatus]);

  const stopListening = useCallback(() => {
    fullStop();
  }, [fullStop]);

  useEffect(() => {
    return () => {
      cancelledRef.current = true;
    };
  }, []);

  return {
    voiceStatus,
    startListening,
    stopListening,
    transcript,
    isListening: voiceStatus !== null,
    voiceNotSupported,
  };
};
