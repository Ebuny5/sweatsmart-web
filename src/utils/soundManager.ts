
export class SoundManager {
  private static instance: SoundManager;
  private audioContext: AudioContext | null = null;
  private soundEnabled = true;
  private userInteracted = false;

  // Professional medical alarm sounds - longer duration, tunnel-like
  private readonly MEDICAL_ALARMS = {
    CRITICAL: 'https://assets.mixkit.co/sfx/preview/mixkit-long-pop-2358.wav', // Longer tunnel-like sound
    WARNING: 'https://assets.mixkit.co/sfx/preview/mixkit-software-interface-start-2574.wav', // Sustained tone
    REMINDER: 'https://assets.mixkit.co/sfx/preview/mixkit-positive-notification-951.wav' // Gentle but sustained
  };

  private constructor() {
    this.setupUserInteractionListener();
  }

  static getInstance(): SoundManager {
    if (!SoundManager.instance) {
      SoundManager.instance = new SoundManager();
    }
    return SoundManager.instance;
  }

  private setupUserInteractionListener(): void {
    const enableAudio = () => {
      this.userInteracted = true;
      this.initializeAudioContext();
      console.log('🔊 User interaction detected, audio enabled');
    };

    ['click', 'touchstart', 'keydown'].forEach(event => {
      document.addEventListener(event, enableAudio, { once: true, passive: true });
    });
  }

  private async initializeAudioContext(): Promise<void> {
    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();

      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }

      console.log('🔊 Audio context initialized');
    } catch (error) {
      console.warn('🔊 Audio context initialization failed:', error);
    }
  }

  async playNotificationSound(severity: 'CRITICAL' | 'WARNING' | 'REMINDER' = 'WARNING'): Promise<void> {
    if (!this.soundEnabled) {
      console.log('🔊 Sound disabled');
      return;
    }

    if (!this.userInteracted) {
      // Audio may be blocked until a user gesture; vibration can still work.
      console.log('🔊 No user interaction yet; attempting vibration + best-effort audio');
    }

    // Enhanced vibration patterns for mobile devices
    if (navigator.vibrate) {
      const vibrationPattern = severity === 'CRITICAL' ? 
        [800, 200, 800, 200, 800] : // Longer vibration for critical
        severity === 'WARNING' ? [600, 150, 600] : [400, 100, 400];
      navigator.vibrate(vibrationPattern);
    }

    try {
      // Method 1: Professional tunnel-like medical alarm sounds
      const audio = new Audio(this.MEDICAL_ALARMS[severity]);
      audio.volume = 1.0; // Maximum volume for professional alerts
      audio.loop = false; // No looping, but longer duration sounds
      
      await audio.play();
      console.log(`🔊 Professional medical alarm played: ${severity}`);
      
      return;
    } catch (error) {
      console.log('🔊 External sound failed, trying Web Audio API');
    }

    try {
      // Method 2: Enhanced Web Audio API fallback with tunnel-like sustained tones
      if (!this.audioContext) {
        await this.initializeAudioContext();
      }

      if (this.audioContext) {
        await this.playProfessionalAlarm(severity);
        console.log(`🔊 Professional Web Audio alarm played: ${severity}`);
        return;
      }
    } catch (error) {
      console.log('🔊 Web Audio failed, trying system beep');
    }

    try {
      // Method 3: Professional system beep fallback
      await this.playProfessionalBeep(severity);
      console.log(`🔊 Professional system beep played: ${severity}`);
    } catch (error) {
      console.warn('🔊 All sound methods failed:', error);
    }
  }

  private async playProfessionalAlarm(severity: 'CRITICAL' | 'WARNING' | 'REMINDER'): Promise<void> {
    if (!this.audioContext) return;

    const sampleRate = this.audioContext.sampleRate;
    const duration = severity === 'CRITICAL' ? 4.0 : severity === 'WARNING' ? 3.0 : 2.0; // Longer durations
    const buffer = this.audioContext.createBuffer(1, sampleRate * duration, sampleRate);
    const data = buffer.getChannelData(0);

    // Generate professional tunnel-like alarm patterns
    for (let i = 0; i < buffer.length; i++) {
      const t = i / sampleRate;
      
      switch (severity) {
        case 'CRITICAL':
          // Deep tunnel resonance with slow fade
          const baseFreq = 200 + Math.sin(t * 2) * 50;
          const harmonic = Math.sin(2 * Math.PI * baseFreq * 2 * t) * 0.3;
          data[i] = (Math.sin(2 * Math.PI * baseFreq * t) + harmonic) * 
                   Math.exp(-t * 0.5) * 0.8; // Slow decay for tunnel effect
          break;
          
        case 'WARNING':
          // Sustained two-tone professional beep
          const freq1 = t < duration/2 ? 880 : 660;
          data[i] = Math.sin(2 * Math.PI * freq1 * t) * 
                   Math.exp(-t * 0.3) * 0.7; // Slower decay
          break;
          
        case 'REMINDER':
          // Gentle ascending tunnel tone
          const freq3 = 440 + (t * 100); // Slower ascent
          data[i] = Math.sin(2 * Math.PI * freq3 * t) * 
                   Math.exp(-t * 0.4) * 0.6; // Extended fade
          break;
      }
    }

    const source = this.audioContext.createBufferSource();
    const gainNode = this.audioContext.createGain();
    
    source.buffer = buffer;
    source.connect(gainNode);
    gainNode.connect(this.audioContext.destination);
    gainNode.gain.value = 1.0; // Maximum volume
    
    source.start();
  }

  private async playProfessionalBeep(severity: 'CRITICAL' | 'WARNING' | 'REMINDER'): Promise<void> {
    const context = new AudioContext();
    const oscillator = context.createOscillator();
    const gainNode = context.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(context.destination);
    
    // Professional frequencies with longer sustain
    const frequency = severity === 'CRITICAL' ? 800 : severity === 'WARNING' ? 600 : 500;
    const duration = severity === 'CRITICAL' ? 3 : severity === 'WARNING' ? 2.5 : 2;
    
    oscillator.frequency.setValueAtTime(frequency, context.currentTime);
    
    gainNode.gain.setValueAtTime(0.8, context.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, context.currentTime + duration);
    
    oscillator.start();
    oscillator.stop(context.currentTime + duration);
  }

  setSoundEnabled(enabled: boolean): void {
    this.soundEnabled = enabled;
    localStorage.setItem('sweatsmart_sound_enabled', JSON.stringify(enabled));
    console.log('🔊 Sound', enabled ? 'enabled' : 'disabled');
  }

  isSoundEnabled(): boolean {
    return this.soundEnabled;
  }

  async testSound(severity: 'CRITICAL' | 'WARNING' | 'REMINDER' = 'WARNING'): Promise<void> {
    console.log(`🧪 Testing ${severity} professional alarm sound...`);
    await this.playNotificationSound(severity);
  }

  async triggerMedicalAlert(severity: 'CRITICAL' | 'WARNING' | 'REMINDER' = 'WARNING'): Promise<void> {
    console.log(`🚨 Professional medical alert triggered: ${severity}`);
    await this.playNotificationSound(severity);
  }
}

export const soundManager = SoundManager.getInstance();
