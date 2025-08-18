
export class SoundManager {
  private static instance: SoundManager;
  private audioContext: AudioContext | null = null;
  private soundEnabled = true;
  private userInteracted = false;

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

    // Listen for any user interaction
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

  async playNotificationSound(): Promise<void> {
    if (!this.soundEnabled || !this.userInteracted) {
      console.log('🔊 Sound disabled or no user interaction');
      return;
    }

    try {
      // Method 1: Try HTML5 Audio with a reliable notification sound
      const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmYdBi+Jz+/UfS4EIXHc7+OZSA0PVqXh+bJlHgU2jdP11n0vBiBx2+ykVwoQUKWe8cJiHAU0j8f34HQsRSF33+TeVQ==');
      audio.volume = 0.6;
      await audio.play();
      console.log('🔊 HTML5 Audio notification played');
      return;
    } catch (error) {
      console.log('🔊 HTML5 Audio failed, trying Web Audio API');
    }

    try {
      // Method 2: Web Audio API fallback
      if (!this.audioContext) {
        await this.initializeAudioContext();
      }

      if (this.audioContext) {
        await this.playWebAudioNotification();
        console.log('🔊 Web Audio notification played');
        return;
      }
    } catch (error) {
      console.log('🔊 Web Audio failed, trying system beep');
    }

    try {
      // Method 3: System beep fallback
      const oscillator = new OscillatorNode(new AudioContext());
      const gainNode = new GainNode(new AudioContext());
      
      oscillator.connect(gainNode);
      gainNode.connect(new AudioContext().destination);
      
      oscillator.frequency.setValueAtTime(800, 0);
      gainNode.gain.setValueAtTime(0.3, 0);
      gainNode.gain.exponentialRampToValueAtTime(0.01, 0.5);
      
      oscillator.start();
      oscillator.stop(0.5);
      
      console.log('🔊 System beep played');
    } catch (error) {
      console.warn('🔊 All sound methods failed:', error);
    }
  }

  private async playWebAudioNotification(): Promise<void> {
    if (!this.audioContext) return;

    const sampleRate = this.audioContext.sampleRate;
    const duration = 0.6;
    const buffer = this.audioContext.createBuffer(1, sampleRate * duration, sampleRate);
    const data = buffer.getChannelData(0);

    // Generate a pleasant two-tone notification sound
    for (let i = 0; i < buffer.length; i++) {
      const t = i / sampleRate;
      if (t < 0.3) {
        // First tone: 880Hz (A5)
        data[i] = Math.sin(2 * Math.PI * 880 * t) * Math.exp(-t * 3) * 0.3;
      } else {
        // Second tone: 660Hz (E5)
        data[i] = Math.sin(2 * Math.PI * 660 * (t - 0.3)) * Math.exp(-(t - 0.3) * 3) * 0.3;
      }
    }

    const source = this.audioContext.createBufferSource();
    source.buffer = buffer;
    source.connect(this.audioContext.destination);
    source.start();
  }

  setSoundEnabled(enabled: boolean): void {
    this.soundEnabled = enabled;
    localStorage.setItem('sweatsmart_sound_enabled', JSON.stringify(enabled));
    console.log('🔊 Sound', enabled ? 'enabled' : 'disabled');
  }

  isSoundEnabled(): boolean {
    return this.soundEnabled;
  }

  async testSound(): Promise<void> {
    console.log('🧪 Testing notification sound...');
    await this.playNotificationSound();
  }
}

export const soundManager = SoundManager.getInstance();
