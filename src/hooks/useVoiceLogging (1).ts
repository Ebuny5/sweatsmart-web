import { useState, useCallback, useRef, useEffect } from "react";
import { BodyArea, Trigger } from "@/types";

/**
 * useVoiceLogging — voice episode logging hook
 *
 * BROWSER SUPPORT:
 * - Chrome (Android + Desktop): ✅ Full support
 * - Safari (iOS + Mac):         ✅ Full support
 * - Samsung Internet:           ✅ Full support
 * - Firefox:                    ❌ Not supported
 * - Brave:                      ⚠️  Sometimes blocked
 *
 * HOW TO USE voiceNotSupported in your component:
 *
 *   const { startListening, voiceNotSupported } = useVoiceLogging({ onAnalysisComplete });
 *
 *   // Hide mic button on unsupported browsers:
 *   {!voiceNotSupported && (
 *     <button onClick={startListening}>🎤 Voice Log</button>
 *   )}
 *
 *   // Show a friendly message instead:
 *   {voiceNotSupported && (
 *     <p>Voice logging requires Chrome or Safari.
 *        Please fill in the form manually.</p>
 *   )}
 *
 * ADAPTIVE SILENCE DETECTION:
 * - Before first word spoken: waits patiently (no timer)
 * - After first word: starts 8 second silence timer
 * - After substantial speech (>20 words): extends to 12 seconds
 * - This gives slow/thoughtful speakers much more breathing room
 */

// ── Browser support check ──────────────────────────────────────────────────
export const isVoiceSupported = (): boolean => {
  return typeof window !== 'undefined' &&
    !!(
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition
    );
};

export type VoiceStatus = 'LISTENING' | 'CONFIRMING' | 'REASONING' | 'SAVING' | null;

interface UseVoiceLoggingProps {
  onAnalysisComplete: (bodyAreas: BodyArea[], triggers: Trigger[], notes: string) => void;
}

export const useVoiceLogging = ({ onAnalysisComplete }: UseVoiceLoggingProps) => {
  const [voiceStatus, setVoiceStatus] = useState<VoiceStatus>(null);
  const [voiceNotSupported, setVoiceNotSupported] = useState(!isVoiceSupported());
  const [transcript, setTranscript] = useState("");
  const recognitionRef = useRef<any>(null);
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const fullTranscriptRef = useRef("");
  const isStoppingIntentionallyRef = useRef(false);
  const restartAttemptsRef = useRef(0);
  const hasSpokenRef = useRef(false); // tracks if user has said anything yet
  const MAX_RESTART_ATTEMPTS = 8; // more attempts = more patient

  const clearSilenceTimer = () => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
  };

  // ── Speak a prompt aloud to the user ──────────────────────────────────────
  const speakPrompt = useCallback((text: string, onDone?: () => void) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      onDone?.();
      return;
    }

    const synth = window.speechSynthesis;
    synth.cancel();

    // Small delay after cancel — required on Android
    setTimeout(() => {
      const utter = new SpeechSynthesisUtterance(text);
      utter.lang = 'en-US';
      utter.rate = 0.95;
      utter.pitch = 1.05;
      utter.volume = 1.0;

      const go = () => {
        const voices = synth.getVoices();
        const preferred = voices.find(v =>
          v.lang.startsWith('en') &&
          ['samantha', 'victoria', 'karen', 'aria', 'zira', 'hazel', 'google uk english female']
            .some(k => v.name.toLowerCase().includes(k))
        ) || voices.find(v => v.lang.startsWith('en'));
        if (preferred) utter.voice = preferred;
        utter.onend = () => { setTimeout(() => onDone?.(), 200); };
        utter.onerror = () => { onDone?.(); };
        synth.speak(utter);
      };

      if (synth.getVoices().length === 0) {
        synth.addEventListener('voiceschanged', go, { once: true });
      } else {
        go();
      }
    }, 150);
  }, []);

  // ── Calculate adaptive silence duration ───────────────────────────────────
  // Slow speakers get more time. Based on word count of what they've said.
  const getAdaptiveSilenceDuration = (text: string): number => {
    const wordCount = text.trim().split(/\s+/).length;
    if (wordCount < 5) return 8000;   // short so far — give 8s
    if (wordCount < 20) return 10000; // medium — give 10s
    return 12000;                      // long speech — give 12s (thoughtful speaker)
  };

  // ── Analyse transcript and save ───────────────────────────────────────────
  const analyseAndSave = useCallback(async (text: string) => {
    setVoiceStatus('REASONING');
    await new Promise(resolve => setTimeout(resolve, 1500));

    const lower = text.toLowerCase();

    // ── BODY AREAS ──
    const detectedAreas: BodyArea[] = [];

    if (lower.includes('palm') || lower.includes('hand') || lower.includes('hands')) detectedAreas.push('palms');
    if (lower.includes('finger') || lower.includes('fingers')) detectedAreas.push('fingers');
    if (lower.includes('sole') || lower.includes('soles') || lower.includes('bottom of my feet') || lower.includes('bottom of feet')) detectedAreas.push('soles');
    if (lower.includes('feet') || lower.includes('foot')) detectedAreas.push('feet');
    if (lower.includes('toe') || lower.includes('toes')) detectedAreas.push('toes');
    if (lower.includes('feet and sole') || lower.includes('foot and sole')) detectedAreas.push('feet_soles');
    if ((lower.includes('face') && lower.includes('scalp')) || lower.includes('face and scalp')) {
      detectedAreas.push('face_scalp');
    } else if (lower.includes('face') || lower.includes('forehead') || lower.includes('cheek') || lower.includes('chin') || lower.includes('facial')) {
      detectedAreas.push('face');
    } else if (lower.includes('scalp') || lower.includes('head') && !lower.includes('forehead')) {
      detectedAreas.push('scalp');
    }
    if (lower.includes('underarm') || lower.includes('armpit') || lower.includes('armpits') || lower.includes('under my arm')) detectedAreas.push('underarms');
    if (lower.includes('entire body') || lower.includes('whole body') || lower.includes('everywhere') || lower.includes('all over')) detectedAreas.push('entire_body');
    if (lower.includes('trunk') || lower.includes('torso') || lower.includes('stomach') || lower.includes('abdomen') || lower.includes('tummy')) detectedAreas.push('trunk');
    if (lower.includes('chest')) detectedAreas.push('chest');
    if (lower.includes('back') && !lower.includes('come back') && !lower.includes('go back')) detectedAreas.push('back');
    if (lower.includes('groin')) detectedAreas.push('groin');
    if (detectedAreas.length === 0) detectedAreas.push('palms');

    // ── TRIGGERS ──
    const detectedTriggerValues: string[] = [];

    // Environment & Situation
    if (lower.includes('hot') || lower.includes('heat') || lower.includes('warm') || lower.includes('temperature') || lower.includes('boiling') || lower.includes('sweaty weather')) detectedTriggerValues.push('hot_temperature');
    if (lower.includes('humid') || lower.includes('humidity') || lower.includes('muggy') || lower.includes('sticky')) detectedTriggerValues.push('high_humidity');
    if (lower.includes('crowd') || lower.includes('crowded') || lower.includes('busy place') || lower.includes('lots of people') || lower.includes('full of people') || lower.includes('packed')) detectedTriggerValues.push('crowded_spaces');
    if (lower.includes('bright light') || lower.includes('bright lights') || lower.includes('strong light')) detectedTriggerValues.push('bright_lights');
    if (lower.includes('loud') || lower.includes('noise') || lower.includes('noisy') || lower.includes('sound')) detectedTriggerValues.push('loud_noises');
    if (lower.includes('transitional') || lower.includes('temperature change') || lower.includes('moved from') || lower.includes('walked into') || lower.includes('came inside') || lower.includes('went outside') || lower.includes('air conditioning') || lower.includes('ac')) detectedTriggerValues.push('transitional_temperature');
    if (lower.includes('synthetic') || lower.includes('fabric') || lower.includes('polyester') || lower.includes('nylon')) detectedTriggerValues.push('synthetic_fabrics');
    if (lower.includes('sun') || lower.includes('outdoor') || lower.includes('outside') || lower.includes('sunshine') || lower.includes('sunlight') || lower.includes('in the open')) detectedTriggerValues.push('outdoor_sun_exposure');

    // Emotional & Cognitive
    if (lower.includes('stress') || lower.includes('stressed') || lower.includes('stressful')) detectedTriggerValues.push('stress');
    if (lower.includes('anxi') || lower.includes('anxious') || lower.includes('anxiety') || lower.includes('worried') || lower.includes('panick')) detectedTriggerValues.push('anxiety');
    if (lower.includes('anticipat') || lower.includes('dreading') || lower.includes('worrying about sweating') || lower.includes('fear of sweating')) detectedTriggerValues.push('anticipatory_sweating');
    if (lower.includes('embarrass') || lower.includes('shame') || lower.includes('humiliat')) detectedTriggerValues.push('embarrassment');
    if (lower.includes('excite') || lower.includes('excited') || lower.includes('excitement') || lower.includes('thrilled')) detectedTriggerValues.push('excitement');
    if (lower.includes('anger') || lower.includes('angry') || lower.includes('frustrat') || lower.includes('annoyed') || lower.includes('upset')) detectedTriggerValues.push('anger');
    if (lower.includes('nervous') || lower.includes('nervousness') || lower.includes('nerves') || lower.includes('jittery') || lower.includes('on edge')) detectedTriggerValues.push('nervousness');
    if (lower.includes('public speak') || lower.includes('presentation') || lower.includes('speaking in front') || lower.includes('giving a talk') || lower.includes('speech')) detectedTriggerValues.push('public_speaking');
    if (lower.includes('social') || lower.includes('party') || lower.includes('gathering') || lower.includes('event') || lower.includes('meeting people') || lower.includes('group')) detectedTriggerValues.push('social_interaction');
    if (lower.includes('work pressure') || lower.includes('work stress') || lower.includes('boss') || lower.includes('deadline') || lower.includes('pressure at work') || lower.includes('office') || lower.includes('job')) detectedTriggerValues.push('work_pressure');
    if (lower.includes('exam') || lower.includes('test') || lower.includes('interview') || lower.includes('assessment')) detectedTriggerValues.push('exam_test_situation');

    // Food, Drink & Gustatory
    if (lower.includes('spicy') || lower.includes('pepper') || lower.includes('chilli') || lower.includes('hot food')) detectedTriggerValues.push('spicy_food');
    if (lower.includes('caffeine') || lower.includes('coffee') || lower.includes('energy drink') || lower.includes('red bull')) detectedTriggerValues.push('caffeine');
    if (lower.includes('alcohol') || lower.includes('beer') || lower.includes('wine') || lower.includes('drink') && lower.includes('alcoholic')) detectedTriggerValues.push('alcohol');
    if (lower.includes('hot drink') || lower.includes('hot beverage') || lower.includes('hot tea') || lower.includes('hot coffee')) detectedTriggerValues.push('hot_drinks');
    if (lower.includes('heavy meal') || lower.includes('big meal') || lower.includes('overate') || lower.includes('ate a lot') || lower.includes('large meal')) detectedTriggerValues.push('heavy_meals');
    if (lower.includes('gustatory') || lower.includes('eating triggered') || lower.includes('after eating') || lower.includes('while eating')) detectedTriggerValues.push('gustatory_sweating');

    // Physical Activity & Body State
    if (lower.includes('exercise') || lower.includes('gym') || lower.includes('workout') || lower.includes('running') || lower.includes('sport') || lower.includes('jogging') || lower.includes('walking fast')) detectedTriggerValues.push('physical_exercise');
    if (lower.includes('night sweat') || lower.includes('sweating at night') || lower.includes('woke up sweating') || lower.includes('sleep sweating')) detectedTriggerValues.push('night_sweats');
    if (lower.includes('poor sleep') || lower.includes('bad sleep') || lower.includes('no sleep') || lower.includes('tired') || lower.includes('exhausted') || lower.includes('insomnia')) detectedTriggerValues.push('poor_sleep');
    if (lower.includes('hormonal') || lower.includes('period') || lower.includes('menstrual') || lower.includes('menopause') || lower.includes('cycle')) detectedTriggerValues.push('hormonal_changes');
    if (lower.includes('ill') || lower.includes('sick') || lower.includes('fever') || lower.includes('infection') || lower.includes('unwell')) detectedTriggerValues.push('illness_fever');
    if (lower.includes('hypoglycemia') || lower.includes('low blood sugar') || lower.includes('sugar dropped') || lower.includes('low sugar')) detectedTriggerValues.push('hypoglycemia');
    if (lower.includes('clothing') || lower.includes('tight clothes') || lower.includes('uniform') || lower.includes('outfit') || lower.includes('what i was wearing')) detectedTriggerValues.push('certain_clothing');

    // Medications
    if (lower.includes('antidepressant') || lower.includes('ssri') || lower.includes('sertraline') || lower.includes('fluoxetine') || lower.includes('prozac')) detectedTriggerValues.push('ssris_antidepressants');
    if (lower.includes('opioid') || lower.includes('pain medication') || lower.includes('morphine') || lower.includes('codeine') || lower.includes('pain killer')) detectedTriggerValues.push('opioids_pain_medication');
    if (lower.includes('ibuprofen') || lower.includes('aspirin') || lower.includes('nsaid') || lower.includes('naproxen')) detectedTriggerValues.push('nsaids');
    if (lower.includes('blood pressure') || lower.includes('amlodipine') || lower.includes('lisinopril') || lower.includes('bp medication')) detectedTriggerValues.push('blood_pressure_medication');
    if (lower.includes('insulin') || lower.includes('diabetes medication') || lower.includes('metformin') || lower.includes('diabetic')) detectedTriggerValues.push('insulin_diabetes_medication');
    if (lower.includes('supplement') || lower.includes('herbal') || lower.includes('vitamin') || lower.includes('tablet') && lower.includes('natural')) detectedTriggerValues.push('supplements_herbal');
    if (lower.includes('new medication') || lower.includes('started taking') || lower.includes('new tablet') || lower.includes('new pill') || lower.includes('just started')) detectedTriggerValues.push('new_medication');

    const detectedTriggers: Trigger[] = detectedTriggerValues.map(t => ({
      id: `${Date.now()}-${t}`,
      name: t.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
      label: t.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
      value: t,
      type: 'environmental',
      category: 'environmental',
      icon: 'zap'
    }));

    setVoiceStatus('SAVING');
    onAnalysisComplete(Array.from(new Set(detectedAreas)), detectedTriggers, text.trim());
    setVoiceStatus(null);
  }, [onAnalysisComplete]);

  // ── Start listening for confirmation (after "Is that all?") ───────────────
  const startConfirmListening = useCallback((currentTranscript: string) => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      analyseAndSave(currentTranscript);
      return;
    }

    const confirmRecognition = new SpeechRecognition();
    confirmRecognition.continuous = false;
    confirmRecognition.interimResults = false;
    confirmRecognition.lang = 'en-US';

    // Wait 5 seconds — if user says nothing, assume yes and proceed
    const confirmTimer = setTimeout(() => {
      isStoppingIntentionallyRef.current = true;
      try { confirmRecognition.stop(); } catch (e) {}
      speakPrompt('Saving your episode.', () => analyseAndSave(currentTranscript));
    }, 5000);

    confirmRecognition.onresult = (event: any) => {
      clearTimeout(confirmTimer);
      const response = event.results[0][0].transcript.toLowerCase().trim();
      isStoppingIntentionallyRef.current = true;
      try { confirmRecognition.stop(); } catch (e) {}

      // Very broad "no" detection — catches all the ways people say they want to continue
      const wantsMore =
        response.startsWith('no') ||
        response.includes('not yet') ||
        response.includes('not done') ||
        response.includes('not finished') ||
        response.includes('not all') ||
        response.includes("that's not") ||
        response.includes('thats not') ||
        response.includes('wait') ||
        response.includes('hold on') ||
        response.includes('more to say') ||
        response.includes('more to add') ||
        response.includes('continue') ||
        response.includes('actually') ||
        response.includes('also') ||
        response.includes('and another') ||
        response.includes('one more') ||
        response.includes("i'm not") ||
        response.includes('im not') ||
        response.includes('nope') ||
        response.includes('nah') ||
        response.includes('negative') ||
        response.includes('keep going') ||
        response.includes('let me') ||
        response.includes("didn't finish") ||
        response.includes('didnt finish');

      if (wantsMore) {
        // User wants to keep talking — go back to listening and append
        speakPrompt('Go ahead, I am still listening.', () => {
          startListeningInternal(true);
        });
      } else {
        // "yes", "done", "that's all", "okay", silence — save
        speakPrompt('Saving your episode.', () => analyseAndSave(currentTranscript));
      }
    };

    confirmRecognition.onerror = () => {
      clearTimeout(confirmTimer);
      // On any error — just proceed and save
      speakPrompt('Saving your episode.', () => analyseAndSave(currentTranscript));
    };

    confirmRecognition.onend = () => {
      // handled by timer and onresult — do nothing here
    };

    try {
      confirmRecognition.start();
    } catch (e) {
      clearTimeout(confirmTimer);
      analyseAndSave(currentTranscript);
    }
  }, [analyseAndSave, speakPrompt]);

  // ── Ask "Is that all?" ────────────────────────────────────────────────────
  const askConfirmation = useCallback((currentTranscript: string) => {
    setVoiceStatus('CONFIRMING');
    // Speak the question aloud, THEN start listening for the answer
    speakPrompt('Is that all?', () => {
      startConfirmListening(currentTranscript);
    });
  }, [speakPrompt, startConfirmListening]);

  // ── Core listening function ───────────────────────────────────────────────
  const startListeningInternal = useCallback((isResuming = false) => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setVoiceNotSupported(true);
      console.warn('SpeechRecognition not supported. Please use Chrome or Safari.');
      return;
    }

    if (!isResuming) {
      fullTranscriptRef.current = '';
      restartAttemptsRef.current = 0;
      hasSpokenRef.current = false;
      setTranscript('');
    }

    isStoppingIntentionallyRef.current = false;

    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;
    recognition.continuous = false; // false = more reliable on Android Chrome
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      setVoiceStatus('LISTENING');
    };

    recognition.onresult = (event: any) => {
      clearSilenceTimer();
      restartAttemptsRef.current = 0;
      hasSpokenRef.current = true;

      const currentTranscript = Array.from(event.results)
        .map((r: any) => r[0].transcript)
        .join(' ');

      const combined = isResuming
        ? (fullTranscriptRef.current + ' ' + currentTranscript).trim()
        : currentTranscript.trim();

      setTranscript(combined);
      fullTranscriptRef.current = combined;

      // Adaptive silence timer — longer for people who speak slowly
      const silenceDuration = getAdaptiveSilenceDuration(combined);
      silenceTimerRef.current = setTimeout(() => {
        isStoppingIntentionallyRef.current = true;
        try { recognition.stop(); } catch (e) {}
        askConfirmation(fullTranscriptRef.current);
      }, silenceDuration);
    };

    recognition.onend = () => {
      // Android Chrome auto-stops recognition every ~5-10 seconds
      // If we didn't stop it intentionally → restart and keep listening
      if (!isStoppingIntentionallyRef.current && voiceStatus === 'LISTENING') {
        if (restartAttemptsRef.current < MAX_RESTART_ATTEMPTS) {
          restartAttemptsRef.current += 1;
          setTimeout(() => {
            try {
              const newRec = new SpeechRecognition();
              recognitionRef.current = newRec;
              newRec.continuous = false;
              newRec.interimResults = true;
              newRec.lang = 'en-US';
              newRec.onresult = recognition.onresult;
              newRec.onend = recognition.onend;
              newRec.onerror = recognition.onerror;
              newRec.start();
            } catch (e) {
              setTimeout(() => startListeningInternal(true), 300);
            }
          }, 100);
        } else {
          // Too many restarts — wrap up with what we have
          if (fullTranscriptRef.current.trim()) {
            askConfirmation(fullTranscriptRef.current);
          } else {
            setVoiceStatus(null);
          }
        }
      }
    };

    recognition.onerror = (event: any) => {
      const error = event.error;

      if (error === 'no-speech') {
        // User hasn't spoken yet — be patient, restart silently
        if (hasSpokenRef.current && fullTranscriptRef.current.trim()) {
          // Had speech before, now silence — treat as done
          isStoppingIntentionallyRef.current = true;
          askConfirmation(fullTranscriptRef.current);
        } else if (restartAttemptsRef.current < MAX_RESTART_ATTEMPTS) {
          restartAttemptsRef.current += 1;
          setTimeout(() => startListeningInternal(isResuming), 300);
        } else {
          setVoiceStatus(null);
        }
        return;
      }

      if (error === 'aborted') return; // intentional — ignore

      // Any other error
      clearSilenceTimer();
      if (fullTranscriptRef.current.trim()) {
        analyseAndSave(fullTranscriptRef.current);
      } else {
        setVoiceStatus(null);
      }
    };

    try {
      recognition.start();
    } catch (e) {
      console.error('Failed to start recognition:', e);
      setVoiceStatus(null);
    }
  }, [analyseAndSave, askConfirmation, voiceStatus]);

  // ── Public start — says "I'm listening" first ─────────────────────────────
  const startListening = useCallback(() => {
    speakPrompt(
      "I'm listening. Please describe your episode in your own words. Take your time.",
      () => startListeningInternal(false)
    );
  }, [speakPrompt, startListeningInternal]);

  const stopListening = useCallback(() => {
    clearSilenceTimer();
    isStoppingIntentionallyRef.current = true;
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch (e) {}
    }
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    setVoiceStatus(null);
    fullTranscriptRef.current = '';
    hasSpokenRef.current = false;
    setTranscript('');
  }, []);

  useEffect(() => {
    return () => {
      clearSilenceTimer();
      isStoppingIntentionallyRef.current = true;
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch (e) {}
      }
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
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
