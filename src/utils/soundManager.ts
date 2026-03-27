export class SoundManager {
  private static instance: SoundManager;
  private soundEnabled = true;
  private femaleVoice: SpeechSynthesisVoice | null = null;
  private voicesLoaded = false;

  private constructor() {
    const saved = localStorage.getItem('sweatsmart_sound_enabled');
    if (saved !== null) this.soundEnabled = JSON.parse(saved);
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

    const pickFemaleVoice = () => {
      const voices = speechSynthesis.getVoices();
      if (!voices.length) return;
      this.voicesLoaded = true;

      const femaleKeywords = [
        'female', 'woman', 'samantha', 'victoria', 'karen', 'fiona',
        'moira', 'tessa', 'susan', 'zira', 'hazel', 'linda', 'jenny',
        'aria', 'sara',
      ];
      const englishVoices = voices.filter(v => v.lang.startsWith('en'));

      this.femaleVoice =
        englishVoices.find(v =>
          femaleKeywords.some(k => v.name.toLowerCase().includes(k))
        ) || null;

      if (!this.femaleVoice && englishVoices.length) {
        this.femaleVoice = englishVoices[0];
      }
      if (!this.femaleVoice && voices.length) {
        this.femaleVoice = voices[0];
      }

      console.log('🗣️ Selected voice:', this.femaleVoice?.name);
    };

    pickFemaleVoice();
    if (!this.voicesLoaded) {
      speechSynthesis.addEventListener('voiceschanged', pickFemaleVoice);
    }
  }

  private speak(text: string, rate = 1.0, pitch = 1.0): void {
    if (!this.soundEnabled || !('speechSynthesis' in window)) return;
    speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    if (this.femaleVoice) utterance.voice = this.femaleVoice;
    utterance.rate = rate;
    utterance.pitch = pitch;
    utterance.volume = 1.0;
    utterance.lang = 'en-US';
    speechSynthesis.speak(utterance);
    console.log(`🗣️ Voice alert: "${text}"`);
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
    this.speak(message, rate, 1.0);
  }

  setSoundEnabled(enabled: boolean): void {
    this.soundEnabled = enabled;
    localStorage.setItem('sweatsmart_sound_enabled', JSON.stringify(enabled));
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
