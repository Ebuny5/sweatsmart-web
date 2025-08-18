
export class SoundManager {
  private static instance: SoundManager;
  private audioContext: AudioContext | null = null;
  private soundEnabled = true;
  private userInteracted = false;

  // Medical alarm sound URLs - louder and more prominent
  private readonly MEDICAL_ALARMS = {
    CRITICAL: 'https://assets.mixkit.co/sfx/preview/mixkit-medical-alarm-loop-493.wav',
    WARNING: 'https://assets.mixkit.co/sfx/preview/mixkit-alarm-digital-clock-beep-989.wav',
    REMINDER: 'https://assets.mixkit.co/sfx/preview/mixkit-clear-announce-tones-2861.wav'
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
    if (!this.userInteracted) return;

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
    if (!this.soundEnabled || !this.userInteracted) {
      console.log('🔊 Sound disabled or no user interaction');
      return;
    }

    // Add vibration for mobile devices
    if (navigator.vibrate) {
      const vibrationPattern = severity === 'CRITICAL' ? [500, 200, 500, 200, 500] : [300, 100, 300];
      navigator.vibrate(vibrationPattern);
    }

    try {
      // Method 1: Try external medical alarm sounds first
      const audio = new Audio(this.MEDICAL_ALARMS[severity]);
      audio.volume = 0.9; // Increased volume to 90%
      audio.loop = severity === 'CRITICAL'; // Loop critical alarms
      
      await audio.play();
      console.log(`🔊 Medical alarm sound played: ${severity}`);
      
      // For critical alarms, stop looping after 10 seconds
      if (severity === 'CRITICAL') {
        setTimeout(() => {
          audio.loop = false;
          audio.pause();
          audio.currentTime = 0;
        }, 10000);
      }
      
      return;
    } catch (error) {
      console.log('🔊 External sound failed, trying Web Audio API');
    }

    try {
      // Method 2: Web Audio API fallback with louder tones
      if (!this.audioContext) {
        await this.initializeAudioContext();
      }

      if (this.audioContext) {
        await this.playWebAudioAlarm(severity);
        console.log(`🔊 Web Audio alarm played: ${severity}`);
        return;
      }
    } catch (error) {
      console.log('🔊 Web Audio failed, trying system beep');
    }

    try {
      // Method 3: Enhanced system beep fallback
      await this.playSystemBeep(severity);
      console.log(`🔊 System beep played: ${severity}`);
    } catch (error) {
      console.warn('🔊 All sound methods failed:', error);
    }
  }

  private async playWebAudioAlarm(severity: 'CRITICAL' | 'WARNING' | 'REMINDER'): Promise<void> {
    if (!this.audioContext) return;

    const sampleRate = this.audioContext.sampleRate;
    const duration = severity === 'CRITICAL' ? 2.0 : 1.0;
    const buffer = this.audioContext.createBuffer(1, sampleRate * duration, sampleRate);
    const data = buffer.getChannelData(0);

    // Generate different alarm patterns based on severity
    for (let i = 0; i < buffer.length; i++) {
      const t = i / sampleRate;
      
      switch (severity) {
        case 'CRITICAL':
          // Loud alternating high-pitched alarm
          const freq1 = 1000 + Math.sin(t * 4) * 200; // Oscillating frequency
          data[i] = Math.sin(2 * Math.PI * freq1 * t) * 0.7 * Math.sin(t * 8); // Amplitude modulation
          break;
          
        case 'WARNING':
          // Two-tone medical beep
          if (t < 0.5) {
            data[i] = Math.sin(2 * Math.PI * 880 * t) * Math.exp(-t * 2) * 0.6;
          } else {
            data[i] = Math.sin(2 * Math.PI * 660 * (t - 0.5)) * Math.exp(-(t - 0.5) * 2) * 0.6;
          }
          break;
          
        case 'REMINDER':
          // Gentle ascending tone
          const freq3 = 440 + (t * 200); // Ascending frequency
          data[i] = Math.sin(2 * Math.PI * freq3 * t) * Math.exp(-t * 1.5) * 0.4;
          break;
      }
    }

    const source = this.audioContext.createBufferSource();
    const gainNode = this.audioContext.createGain();
    
    source.buffer = buffer;
    source.connect(gainNode);
    gainNode.connect(this.audioContext.destination);
    gainNode.gain.value = 0.8; // High volume
    
    source.start();
  }

  private async playSystemBeep(severity: 'CRITICAL' | 'WARNING' | 'REMINDER'): Promise<void> {
    const context = new AudioContext();
    const oscillator = context.createOscillator();
    const gainNode = context.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(context.destination);
    
    // Different frequencies for different severities
    const frequency = severity === 'CRITICAL' ? 1000 : severity === 'WARNING' ? 800 : 600;
    oscillator.frequency.setValueAtTime(frequency, context.currentTime);
    
    gainNode.gain.setValueAtTime(0.6, context.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, context.currentTime + 1);
    
    oscillator.start();
    oscillator.stop(context.currentTime + 1);
    
    // For critical alarms, play multiple beeps
    if (severity === 'CRITICAL') {
      setTimeout(() => this.playSystemBeep('WARNING'), 1200);
      setTimeout(() => this.playSystemBeep('WARNING'), 2400);
    }
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
    console.log(`🧪 Testing ${severity} alarm sound...`);
    await this.playNotificationSound(severity);
  }

  // New method to trigger alerts based on medical severity
  async triggerMedicalAlert(severity: 'CRITICAL' | 'WARNING' | 'REMINDER' = 'WARNING'): Promise<void> {
    console.log(`🚨 Medical alert triggered: ${severity}`);
    await this.playNotificationSound(severity);
  }
}

export const soundManager = SoundManager.getInstance();
