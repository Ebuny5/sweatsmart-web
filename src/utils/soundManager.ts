export class SoundManager {
  private static instance: SoundManager;
  private soundEnabled = true;
  private femaleVoice: SpeechSynthesisVoice | null = null;
  private maleVoice: SpeechSynthesisVoice | null = null;
  private voicesLoaded = false;

  private constructor() {
    // Sync with Climate Alert Settings from Settings.tsx
    const climateSettings = localStorage.getItem('climateAppSettings');
    if (climateSettings) {
      try {
        const parsed = JSON.parse(climateSettings);
        if (parsed.soundAlerts !== undefined) {
          this.soundEnabled = parsed.soundAlerts;
        }
      } catch (e) {
        console.error('Failed to parse climateAppSettings in SoundManager:', e);
      }
    } else {
      const saved = localStorage.getItem('sweatsmart_sound_enabled');
      if (saved !== null) this.soundEnabled = JSON.parse(saved);
    }
    this.loadVoices();
  }

  static getInstance(): SoundManager {
    if (!SoundManager.instance) {
      SoundManager.instance = new SoundManager();
    }
    return SoundManager.instance;
  }

  private loadVoices(): void {
    if (!('speechSynthesis' in window)) return;

    const pickVoices = () => {
      const voices = speechSynthesis.getVoices();
      if (!voices.length) return;
      this.voicesLoaded = true;

      const femaleKeywords = [
        'female', 'woman', 'samantha', 'victoria', 'karen', 'fiona',
        'moira', 'tessa', 'susan', 'zira', 'hazel', 'linda', 'jenny',
        'aria', 'sara', 'google us english', 'google uk english female'
      ];
      const maleKeywords = [
        'male', 'man', 'guy', 'david', 'mark', 'antoni', 'josh', 'adam',
        'google uk english male', 'google us english male', 'microsoft david', 'microsoft mark'
      ];
      const englishVoices = voices.filter(v => v.lang.startsWith('en'));

      this.femaleVoice =
        englishVoices.find(v =>
          femaleKeywords.some(k => v.name.toLowerCase().includes(k))
        ) || null;

      this.maleVoice =
        englishVoices.find(v =>
          maleKeywords.some(k => v.name.toLowerCase().includes(k))
        ) || null;

      if (!this.femaleVoice && englishVoices.length) {
        this.femaleVoice = englishVoices[0];
      }
      if (!this.maleVoice && englishVoices.length) {
        this.maleVoice = englishVoices.find(v => !this.femaleVoice || v.name !== this.femaleVoice.name) || englishVoices[0];
      }

      console.log('🗣️ Selected voices:', {
        female: this.femaleVoice?.name,
        male: this.maleVoice?.name
      });
    };

    pickVoices();
    if (!this.voicesLoaded) {
      speechSynthesis.addEventListener('voiceschanged', pickVoices);
    }
  }

  private speak(text: string, rate = 1.0, pitch = 1.0, gender: 'male' | 'female' = 'female'): void {
    if (!this.soundEnabled || !('speechSynthesis' in window)) return;
    speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);

    const selectedVoice = gender === 'male' ? this.maleVoice : this.femaleVoice;
    if (selectedVoice) utterance.voice = selectedVoice;

    utterance.rate = rate;
    utterance.pitch = pitch;
    utterance.volume = 1.0;
    utterance.lang = 'en-US';
    speechSynthesis.speak(utterance);
    console.log(`🗣️ Voice alert (${gender}): "${text}"`);
  }

  async playNotificationSound(
    severity: 'CRITICAL' | 'WARNING' | 'MODERATE' | 'LOW' | 'OPTIMAL' | 'REMINDER' = 'WARNING'
  ): Promise<void> {
    if (!this.soundEnabled) return;

    if (navigator.vibrate) {
      const pattern =
        severity === 'CRITICAL' ? [800, 200, 800, 200, 800] :
        severity === 'WARNING'  ? [600, 150, 600] :
        severity === 'REMINDER' ? [400, 100, 400] :
                                  [200, 100, 200];
      navigator.vibrate(pattern);
    }

    switch (severity) {
      case 'CRITICAL':
        this.speak(
          'Extreme risk alert. Current environmental and physiological conditions present a critical risk for hyperhidrosis. ' +
          'Please move to a cool, shaded environment immediately and stay well hydrated.',
          1.0, 1.05
        );
        break;

      case 'WARNING':
        this.speak(
          'High risk advisory. Elevated temperature and humidity levels have been detected in your area. ' +
          'Please take precautionary measures, increase fluid intake, and limit prolonged outdoor exposure.',
          0.97, 1.0
        );
        break;

      case 'MODERATE':
        this.speak(
          'Moderate climate alert. Conditions are approaching levels that may aggravate symptoms. ' +
          'It is advisable to monitor your environment and remain hydrated.',
          0.95, 1.0
        );
        break;

      case 'LOW':
        this.speak(
          'Low risk notice. Mild climate conditions are present. ' +
          'Continue normal activities while remaining attentive to any changes.',
          0.93, 1.0
        );
        break;

      case 'OPTIMAL':
        this.speak(
          'Conditions are currently optimal. Environmental factors are within comfortable ranges for hyperhidrosis management.',
          0.92, 1.0
        );
        break;

      case 'REMINDER':
        this.speak(
          'Scheduled logging reminder. Four hours have elapsed since your last recorded entry. ' +
          'Please open SweatSmart and log your current hyperhidrosis severity at your earliest convenience.',
          0.95, 1.0
        );
        break;
    }
  }

  /** Speak a custom professional message with risk-appropriate tone */
  async speakCustom(
    message: string,
    severity: 'CRITICAL' | 'WARNING' | 'MODERATE' | 'LOW' | 'OPTIMAL' | 'REMINDER' = 'WARNING'
  ): Promise<void> {
    if (!this.soundEnabled) return;

    if (navigator.vibrate) {
      const pattern =
        severity === 'CRITICAL' ? [800, 200, 800, 200, 800] :
        severity === 'WARNING'  ? [600, 150, 600] :
                                  [200, 100, 200];
      navigator.vibrate(pattern);
    }

    const rate = severity === 'CRITICAL' ? 1.02 : 0.95;
    this.speak(message, rate, 1.0, 'female');
  }

  /** Speak a custom message with explicit gender and settings control */
  async speakCustomWithGender(
    message: string,
    gender: 'male' | 'female' = 'female',
    rate = 1.0,
    pitch = 1.0,
    onEnd?: () => void
  ): Promise<void> {
    if (!this.soundEnabled || !('speechSynthesis' in window)) {
      onEnd?.();
      return;
    }

    speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(message);

    const selectedVoice = gender === 'male' ? this.maleVoice : this.femaleVoice;
    if (selectedVoice) utterance.voice = selectedVoice;

    utterance.rate = rate;
    utterance.pitch = pitch;
    utterance.volume = 1.0;
    utterance.lang = 'en-US';

    utterance.onstart = () => console.log(`🗣️ Starting browser TTS (${gender})`);
    utterance.onend = () => {
      console.log(`🗣️ Finished browser TTS (${gender})`);
      onEnd?.();
    };
    utterance.onerror = (e) => {
      console.error(`🗣️ Browser TTS error (${gender}):`, e);
      onEnd?.();
    };

    speechSynthesis.speak(utterance);
  }

  setSoundEnabled(enabled: boolean): void {
    this.soundEnabled = enabled;
    localStorage.setItem('sweatsmart_sound_enabled', JSON.stringify(enabled));

    // Also sync back to climateAppSettings if it exists
    const climateSettings = localStorage.getItem('climateAppSettings');
    if (climateSettings) {
      try {
        const parsed = JSON.parse(climateSettings);
        parsed.soundAlerts = enabled;
        localStorage.setItem('climateAppSettings', JSON.stringify(parsed));
      } catch (e) {
        console.error('Failed to update climateAppSettings in SoundManager:', e);
      }
    }

    if (!enabled) speechSynthesis?.cancel();
  }

  isSoundEnabled(): boolean {
    return this.soundEnabled;
  }

  async testSound(
    severity: 'CRITICAL' | 'WARNING' | 'MODERATE' | 'LOW' | 'OPTIMAL' | 'REMINDER' = 'WARNING'
  ): Promise<void> {
    await this.playNotificationSound(severity);
  }

  async triggerMedicalAlert(
    severity: 'CRITICAL' | 'WARNING' | 'MODERATE' | 'LOW' | 'OPTIMAL' | 'REMINDER' = 'WARNING'
  ): Promise<void> {
    await this.playNotificationSound(severity);
  }
}

export const soundManager = SoundManager.getInstance();
