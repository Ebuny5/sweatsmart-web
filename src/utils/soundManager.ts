
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

      // Prefer English female voices
      const femaleKeywords = ['female', 'woman', 'samantha', 'victoria', 'karen', 'fiona', 'moira', 'tessa', 'susan', 'zira', 'hazel', 'linda', 'jenny', 'aria', 'sara'];
      const englishVoices = voices.filter(v => v.lang.startsWith('en'));

      // Try to find a female voice by name
      this.femaleVoice = englishVoices.find(v =>
        femaleKeywords.some(k => v.name.toLowerCase().includes(k))
      ) || null;

      // Fallback: pick the first English voice (many defaults are female)
      if (!this.femaleVoice && englishVoices.length) {
        this.femaleVoice = englishVoices[0];
      }

      // Last resort: any voice
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

  private speak(text: string, rate: number = 1.0, pitch: number = 1.0): void {
    if (!this.soundEnabled || !('speechSynthesis' in window)) return;

    // Cancel any ongoing speech
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

  async playNotificationSound(severity: 'CRITICAL' | 'WARNING' | 'REMINDER' = 'WARNING'): Promise<void> {
    if (!this.soundEnabled) return;

    // Vibrate on mobile
    if (navigator.vibrate) {
      const pattern = severity === 'CRITICAL' ? [800, 200, 800, 200, 800] :
                      severity === 'WARNING' ? [600, 150, 600] : [400, 100, 400];
      navigator.vibrate(pattern);
    }

    switch (severity) {
      case 'CRITICAL':
        this.speak('Critical alert! Your sweat risk is extremely high. Please take immediate action.', 1.0, 1.1);
        break;
      case 'WARNING':
        this.speak('Warning. Elevated sweat risk detected. Please check your climate alerts.', 1.0, 1.0);
        break;
      case 'REMINDER':
        this.speak('Reminder. It is time to log your sweat episode. Please open SweatSmart.', 0.95, 1.0);
        break;
    }
  }

  /** Speak a custom message (used by climate alerts with specific details) */
  async speakCustom(message: string, severity: 'CRITICAL' | 'WARNING' | 'REMINDER' = 'WARNING'): Promise<void> {
    if (!this.soundEnabled) return;

    if (navigator.vibrate) {
      const pattern = severity === 'CRITICAL' ? [800, 200, 800, 200, 800] :
                      severity === 'WARNING' ? [600, 150, 600] : [400, 100, 400];
      navigator.vibrate(pattern);
    }

    const rate = severity === 'CRITICAL' ? 1.05 : 0.95;
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

  async testSound(severity: 'CRITICAL' | 'WARNING' | 'REMINDER' = 'WARNING'): Promise<void> {
    await this.playNotificationSound(severity);
  }

  async triggerMedicalAlert(severity: 'CRITICAL' | 'WARNING' | 'REMINDER' = 'WARNING'): Promise<void> {
    await this.playNotificationSound(severity);
  }
}

export const soundManager = SoundManager.getInstance();
