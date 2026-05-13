import { useState, useCallback, useRef, useEffect } from "react";
import { BodyArea, Trigger } from "@/types";
import { supabase } from "@/integrations/supabase/client";

/**
 * useVoiceLogging — Custom Audio + Browser SpeechRecognition
 *
 * CRITICAL ANDROID RULE:
 * Audio playback and SpeechRecognition CANNOT run at the same time on Android Chrome.
 * This file enforces: play audio FULLY → wait → THEN start recognition. Always.
 *
 * Flow:
 *   1. Tap mic → play "I'm listening.mp3" → wait for it to finish → start recognition
 *   2. User speaks → live transcript shown → silence detected → stop recognition
 *   3. Play "Got it, anything else?.mp3" → wait → start short recognition for yes/no
 *   4a. User says yes/more → play "Go ahead.mp3" → wait → resume recording (append)
 *   4b. User says no/silence → play "Saving your episode.mp3" → wait → extract → save
 *   5. Extract body areas + triggers from transcript → call onAnalysisComplete
 *
 * Status text shown on screen matches each audio file exactly:
 *   LISTENING   → "I'm listening..."
 *   CONFIRMING  → "Got it — anything else?"
 *   REASONING   → "Analysing your episode..."
 *   SAVING      → "Saving your episode..."
 */

export const isVoiceSupported = (): boolean => {
  if (typeof window === 'undefined') return false;
  return !!(
    (window as any).SpeechRecognition ||
    (window as any).webkitSpeechRecognition
  );
};

export type VoiceStatus = 'LISTENING' | 'CONFIRMING' | 'REASONING' | 'SAVING' | null;

// Status labels — match the audio files exactly
export const VOICE_STATUS_LABELS: Record<NonNullable<VoiceStatus>, string> = {
  LISTENING: "I'm listening...",
  CONFIRMING: "Got it — anything else?",
  REASONING: "Analysing your episode...",
  SAVING: "Saving your episode...",
};

interface UseVoiceLoggingProps {
  onAnalysisComplete: (bodyAreas: BodyArea[], triggers: Trigger[], notes: string, severity?: number) => void;
}

// ── Audio file paths ──────────────────────────────────────────────────────
// Place these mp3 files in /public/sounds/
const SOUNDS = {
  listening:    '/sounds/Im listening.mp3',
  gotItMore:    '/sounds/Got it Anything else.mp3',
  goAhead:      '/sounds/Go ahead.mp3',
  saving:       '/sounds/saving your episode.mp3',
};

// Words that mean "yes I have more to say"
const YES_MORE_KEYWORDS = [
  'yes', 'yeah', 'yep', 'yup', 'sure', 'go ahead',
  'more', 'wait', 'hold on', 'not yet', 'not done',
  'not finished', 'continue', 'actually', 'also',
  'one more', 'let me', 'i have more', 'add more',
  'nope wait', 'no wait',
];

// Words that mean "no I'm done"
const NO_DONE_KEYWORDS = [
  'no', 'nope', 'nah', 'done', "that's all", 'thats all',
  "that's it", 'thats it', 'finished', 'complete', 'save it',
  'save', 'nothing', 'nothing else',
];

// ── Play audio and wait for it to finish ──────────────────────────────────
// Returns a promise that resolves when audio ends or errors.
// Guaranteed to resolve — never hangs.
function playAudio(src: string): Promise<void> {
  return new Promise((resolve) => {
    // Safety timeout — if audio takes >8s something is wrong, move on
    const timeout = setTimeout(() => resolve(), 8000);
    try {
      const audio = new Audio(src);
      audio.onended = () => { clearTimeout(timeout); resolve(); };
      audio.onerror = () => { clearTimeout(timeout); resolve(); };
      const playPromise = audio.play();
      if (playPromise) {
        playPromise.catch(() => { clearTimeout(timeout); resolve(); });
      }
    } catch {
      clearTimeout(timeout);
      resolve();
    }
  });
}

// ── Run SpeechRecognition once and return transcript ─────────────────────
// continuous=false is MORE reliable on Android than continuous=true.
// We show interim results for live transcript display.
function runRecognition(
  onInterim: (text: string) => void,
  silenceMs: number = 5000
): Promise<string> {
  return new Promise((resolve) => {
    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      resolve('');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.continuous = false;
    recognition.interimResults = true; // show live transcript
    recognition.maxAlternatives = 1;

    let finalTranscript = '';
    let interimTranscript = '';
    let silenceTimer: ReturnType<typeof setTimeout> | null = null;
    let hasStarted = false;
    let restarts = 0;
    const MAX_RESTARTS = 6;

    const resetSilenceTimer = () => {
      if (silenceTimer) clearTimeout(silenceTimer);
      silenceTimer = setTimeout(() => {
        recognition.stop();
      }, silenceMs);
    };

    recognition.onstart = () => {
      hasStarted = true;
      // Start silence timer — if user says nothing for silenceMs, stop
      resetSilenceTimer();
    };

    recognition.onresult = (event: any) => {
      resetSilenceTimer();
      interimTranscript = '';
      finalTranscript = '';

      for (let i = 0; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalTranscript += result[0].transcript + ' ';
        } else {
          interimTranscript += result[0].transcript;
        }
      }

      // Show live — final + interim combined
      onInterim((finalTranscript + interimTranscript).trim());
    };

    recognition.onend = () => {
      if (silenceTimer) clearTimeout(silenceTimer);
      const result = finalTranscript.trim() || interimTranscript.trim();

      if (!result && restarts < MAX_RESTARTS) {
        // Android stopped recognition before user spoke — restart silently
        restarts++;
        setTimeout(() => {
          try { recognition.start(); } catch {
            resolve('');
          }
        }, 200);
        return;
      }

      resolve(result);
    };

    recognition.onerror = (event: any) => {
      if (silenceTimer) clearTimeout(silenceTimer);
      const err = event.error;

      if (err === 'no-speech') {
        if (restarts < MAX_RESTARTS) {
          restarts++;
          setTimeout(() => {
            try { recognition.start(); } catch { resolve(''); }
          }, 200);
          return;
        }
      }

      if (err === 'aborted') {
        resolve(finalTranscript.trim());
        return;
      }

      resolve(finalTranscript.trim());
    };

    try {
      recognition.start();
    } catch {
      resolve('');
    }
  });
}

// ── Keyword fallback extraction ───────────────────────────────────────────
function fallbackExtract(text: string): { bodyAreas: BodyArea[]; triggerValues: string[] } {
  const lower = text.toLowerCase();
  const bodyAreas: BodyArea[] = [];

  if (/\b(palm|palms|hand|hands)\b/.test(lower)) bodyAreas.push('palms');
  if (/\b(finger|fingers)\b/.test(lower)) bodyAreas.push('fingers');
  if (/\b(sole|soles|bottom of (my )?feet)\b/.test(lower)) bodyAreas.push('soles');
  if (/\b(feet|foot)\b/.test(lower)) bodyAreas.push('feet');
  if (/\b(toe|toes)\b/.test(lower)) bodyAreas.push('toes');
  if (/\b(face|forehead|cheek|chin|facial)\b/.test(lower)) bodyAreas.push('face');
  if (/\b(scalp)\b/.test(lower)) bodyAreas.push('scalp');
  if (/\b(underarm|armpit|armpits)\b/.test(lower)) bodyAreas.push('underarms');
  if (/\b(chest)\b/.test(lower)) bodyAreas.push('chest');
  if (/\b(back)\b/.test(lower) && !/\bgo back\b|\bcome back\b/.test(lower)) bodyAreas.push('back');
  if (/\b(groin)\b/.test(lower)) bodyAreas.push('groin');
  if (/whole body|entire body|everywhere|all over/.test(lower)) bodyAreas.push('entire_body');

  const triggerValues: string[] = [];
  if (/\b(hot|heat|warm|temperature)\b/.test(lower)) triggerValues.push('hot_temperature');
  if (/\b(humid|humidity|muggy|sticky)\b/.test(lower)) triggerValues.push('high_humidity');
  if (/\b(stress|stressed)\b/.test(lower)) triggerValues.push('stress');
  if (/\b(anxi|anxious|anxiety)\b/.test(lower)) triggerValues.push('anxiety');
  if (/\b(nervous|nerves|nervousness)\b/.test(lower)) triggerValues.push('nervousness');
  if (/\b(angry|anger|angry|frustrat|furious)\b/.test(lower)) triggerValues.push('anger');
  if (/\b(embarrass|shame)\b/.test(lower)) triggerValues.push('embarrassment');
  if (/\b(spicy|chilli|pepper|hot food)\b/.test(lower)) triggerValues.push('spicy_food');
  if (/\b(coffee|caffeine|energy drink)\b/.test(lower)) triggerValues.push('caffeine');
  if (/\b(alcohol|beer|wine)\b/.test(lower)) triggerValues.push('alcohol');
  if (/\b(exercise|gym|workout|running|sport|jogging)\b/.test(lower)) triggerValues.push('physical_exercise');
  if (/\b(public speak|presentation|interview|exam|assessment)\b/.test(lower)) triggerValues.push('public_speaking');
  if (/\b(crowd|crowded|busy place|packed)\b/.test(lower)) triggerValues.push('crowded_spaces');
  if (/\b(sun|outdoor|outside|sunshine|sunlight)\b/.test(lower)) triggerValues.push('outdoor_sun_exposure');
  if (/\b(work pressure|deadline|boss|office)\b/.test(lower)) triggerValues.push('work_pressure');
  if (/\b(social|party|gathering|event)\b/.test(lower)) triggerValues.push('social_interaction');
  if (/\b(hormone|period|menstrual|menopause)\b/.test(lower)) triggerValues.push('hormonal_changes');
  if (/\b(ill|sick|fever|infection)\b/.test(lower)) triggerValues.push('illness_fever');
  if (/\b(poor sleep|bad sleep|no sleep|tired|exhausted)\b/.test(lower)) triggerValues.push('poor_sleep');

  return {
    bodyAreas: bodyAreas.length > 0 ? Array.from(new Set(bodyAreas)) : ['palms'],
    triggerValues: Array.from(new Set(triggerValues)),
  };
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

// ── Main Hook ─────────────────────────────────────────────────────────────
export const useVoiceLogging = ({ onAnalysisComplete }: UseVoiceLoggingProps) => {
  const [voiceStatus, setVoiceStatus] = useState<VoiceStatus>(null);
  const [voiceNotSupported, setVoiceNotSupported] = useState(!isVoiceSupported());
  const [liveTranscript, setLiveTranscript] = useState('');

  const cancelledRef = useRef(false);
  const fullTranscriptRef = useRef('');

  // ── Stop everything at any time ─────────────────────────────────────────
  const stopListening = useCallback(() => {
    cancelledRef.current = true;
    setVoiceStatus(null);
    setLiveTranscript('');
    fullTranscriptRef.current = '';
  }, []);

  // ── Main recording flow ──────────────────────────────────────────────────
  const runFlow = useCallback(async () => {
    cancelledRef.current = false;
    fullTranscriptRef.current = '';
    setLiveTranscript('');

    // ── Step 1: Play "I'm listening" → then start recognition ──────────────
    setVoiceStatus('LISTENING');
    await playAudio(SOUNDS.listening);
    if (cancelledRef.current) return;

    // ── Recording loop ──────────────────────────────────────────────────────
    while (!cancelledRef.current) {

      // Record what the user says (adaptive silence: 6s)
      setVoiceStatus('LISTENING');
      const segment = await runRecognition(
        (interim) => {
          // Show combined transcript live while user speaks
          const combined = fullTranscriptRef.current
            ? fullTranscriptRef.current + ' ' + interim
            : interim;
          setLiveTranscript(combined.trim());
        },
        6000 // 6 seconds silence = done with this segment
      );

      if (cancelledRef.current) return;

      // Append segment to full transcript
      if (segment) {
        fullTranscriptRef.current = fullTranscriptRef.current
          ? fullTranscriptRef.current + ' ' + segment
          : segment;
        setLiveTranscript(fullTranscriptRef.current.trim());
      }

      // ── Step 2: Play "Got it, anything else?" → listen for yes/no ─────────
      setVoiceStatus('CONFIRMING');
      await playAudio(SOUNDS.gotItMore);
      if (cancelledRef.current) return;

      // Short recognition for yes/no (3 seconds max silence)
      const confirmation = await runRecognition(
        () => {}, // no live display needed for yes/no
        3000
      );

      if (cancelledRef.current) return;

      const lower = confirmation.toLowerCase().trim();
      console.log('[voice] confirmation heard:', lower);

      // Check if user wants to say more
      const wantsMore =
        YES_MORE_KEYWORDS.some((k) => lower.includes(k)) &&
        !NO_DONE_KEYWORDS.some((k) => lower === k || lower.startsWith(k + ' '));

      // If silence (empty) → treat as "no, I'm done"
      const isDone = !lower || NO_DONE_KEYWORDS.some((k) => lower.includes(k));

      if (wantsMore && !isDone) {
        // User wants to add more
        await playAudio(SOUNDS.goAhead);
        if (cancelledRef.current) return;
        continue; // loop back → record another segment
      }

      // User is done
      break;
    }

    if (cancelledRef.current) return;

    // ── Step 3: Play "Saving your episode" ────────────────────────────────
    setVoiceStatus('SAVING');
    await playAudio(SOUNDS.saving);
    if (cancelledRef.current) return;

    const finalText = fullTranscriptRef.current.trim();

    if (!finalText) {
      // Nothing was captured — exit cleanly, NO fallback browser voice
      setVoiceStatus(null);
      setLiveTranscript('');
      return;
    }

    // ── Step 4: Extract body areas + triggers ──────────────────────────────
    setVoiceStatus('REASONING');

    let bodyAreas: BodyArea[] = [];
    let triggerValues: string[] = [];
    let detectedSeverity: number | undefined;

    try {
      const { data } = await supabase.functions.invoke('voice-transcribe', {
        body: { mode: 'extract', text: finalText },
      });
      const tags = data?.tags;
      if (tags?.body_areas?.length) bodyAreas = tags.body_areas as BodyArea[];
      if (tags?.triggers?.length) triggerValues = tags.triggers;
      if (tags?.severity) detectedSeverity = tags.severity;
    } catch (e) {
      console.warn('[voice] extract failed, using keyword fallback', e);
    }

    // Keyword fallback if AI extraction failed or returned nothing
    if (bodyAreas.length === 0 || triggerValues.length === 0) {
      const fb = fallbackExtract(finalText);
      if (bodyAreas.length === 0) bodyAreas = fb.bodyAreas;
      if (triggerValues.length === 0) triggerValues = fb.triggerValues;
    }

    setVoiceStatus(null);
    setLiveTranscript('');

    // ── IMPORTANT: Do NOT play any browser speechSynthesis here.
    // Do NOT show "couldn't find affected area" message.
    // Just call onAnalysisComplete with what we found.
    onAnalysisComplete(
      Array.from(new Set(bodyAreas)),
      valuesToTriggers(triggerValues),
      finalText,
      detectedSeverity
    );
  }, [onAnalysisComplete]);

  // ── Public start ─────────────────────────────────────────────────────────
  const startListening = useCallback(() => {
    if (!isVoiceSupported()) {
      setVoiceNotSupported(true);
      return;
    }
    if (voiceStatus !== null) return; // already running
    runFlow();
  }, [runFlow, voiceStatus]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cancelledRef.current = true;
    };
  }, []);

  return {
    voiceStatus,
    voiceStatusLabel: voiceStatus ? VOICE_STATUS_LABELS[voiceStatus] : null,
    startListening,
    stopListening,
    liveTranscript,
    transcript: liveTranscript,
    isListening: voiceStatus !== null,
    voiceNotSupported,
  };
};
