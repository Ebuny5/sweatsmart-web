
export class SoundManager {
  private static instance: SoundManager;
  private audioContext: AudioContext | null = null;
  private soundEnabled = true;

  private constructor() {
    // Load saved preference
    const saved = localStorage.getItem('sweatsmart_sound_enabled');
    if (saved !== null) this.soundEnabled = JSON.parse(saved);
  }

  static getInstance(): SoundManager {
    if (!SoundManager.instance) {
      SoundManager.instance = new SoundManager();
    }
    return SoundManager.instance;
  }

  private async ensureAudioContext(): Promise<AudioContext | null> {
    try {
      if (!this.audioContext || this.audioContext.state === 'closed') {
        this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }
      return this.audioContext;
    } catch (error) {
      console.warn('🔊 Audio context failed:', error);
      return null;
    }
  }

  async playNotificationSound(severity: 'CRITICAL' | 'WARNING' | 'REMINDER' = 'WARNING'): Promise<void> {
    if (!this.soundEnabled) return;

    // Vibrate on mobile
    if (navigator.vibrate) {
      const pattern = severity === 'CRITICAL' ? [800, 200, 800, 200, 800] :
                      severity === 'WARNING' ? [600, 150, 600] : [400, 100, 400];
      navigator.vibrate(pattern);
    }

    // Always use Web Audio API - no external URLs that can fail
    const ctx = await this.ensureAudioContext();
    if (!ctx) return;

    try {
      const sampleRate = ctx.sampleRate;
      const duration = severity === 'CRITICAL' ? 2.5 : severity === 'WARNING' ? 1.8 : 1.2;
      const buffer = ctx.createBuffer(1, sampleRate * duration, sampleRate);
      const data = buffer.getChannelData(0);

      for (let i = 0; i < buffer.length; i++) {
        const t = i / sampleRate;
        switch (severity) {
          case 'CRITICAL': {
            const freq = 200 + Math.sin(t * 2) * 50;
            const harmonic = Math.sin(2 * Math.PI * freq * 2 * t) * 0.3;
            data[i] = (Math.sin(2 * Math.PI * freq * t) + harmonic) * Math.exp(-t * 0.5) * 0.8;
            break;
          }
          case 'WARNING': {
            const freq = t < duration / 2 ? 880 : 660;
            data[i] = Math.sin(2 * Math.PI * freq * t) * Math.exp(-t * 0.4) * 0.7;
            break;
          }
          case 'REMINDER': {
            const freq = 440 + t * 120;
            data[i] = Math.sin(2 * Math.PI * freq * t) * Math.exp(-t * 0.5) * 0.6;
            break;
          }
        }
      }

      const source = ctx.createBufferSource();
      const gainNode = ctx.createGain();
      source.buffer = buffer;
      source.connect(gainNode);
      gainNode.connect(ctx.destination);
      gainNode.gain.value = 0.9;
      source.start();
      console.log(`🔊 Alert sound played: ${severity}`);
    } catch (error) {
      console.warn('🔊 Sound playback failed:', error);
    }
  }

  setSoundEnabled(enabled: boolean): void {
    this.soundEnabled = enabled;
    localStorage.setItem('sweatsmart_sound_enabled', JSON.stringify(enabled));
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
