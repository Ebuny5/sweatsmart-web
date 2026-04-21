/**
 * SoundManager — thin compatibility shim over the new AudioAlertPlayer.
 *
 * Kept so existing call sites (`soundManager.playNotificationSound`,
 * `triggerMedicalAlert`, `speakCustom`) continue to work without changes,
 * but all audio now comes from pre-recorded MP3 files (water sound → voice),
 * NOT browser speechSynthesis.
 */

import { audioAlertPlayer, type AlertKind } from './audioAlertPlayer';

type LegacySeverity =
  | 'CRITICAL'
  | 'WARNING'
  | 'MODERATE'
  | 'LOW'
  | 'OPTIMAL'
  | 'REMINDER';

function severityToKind(severity: LegacySeverity): AlertKind | null {
  switch (severity) {
    case 'CRITICAL':
      return 'extreme';
    case 'WARNING':
      return 'high';
    case 'MODERATE':
      return 'moderate';
    case 'LOW':
      return 'low';
    case 'REMINDER':
      return 'reminder';
    case 'OPTIMAL':
    default:
      // Optimal/safe never plays an alert
      return null;
  }
}

class SoundManager {
  private static instance: SoundManager;

  static getInstance(): SoundManager {
    if (!SoundManager.instance) SoundManager.instance = new SoundManager();
    return SoundManager.instance;
  }

  async playNotificationSound(severity: LegacySeverity = 'WARNING'): Promise<void> {
    const kind = severityToKind(severity);
    if (!kind) return;
    await audioAlertPlayer.playAlert(kind);
  }

  /** Legacy "speak custom text" call — text is ignored, voice file plays instead. */
  async speakCustom(_message: string, severity: LegacySeverity = 'WARNING'): Promise<void> {
    await this.playNotificationSound(severity);
  }

  async triggerMedicalAlert(severity: LegacySeverity = 'WARNING'): Promise<void> {
    await this.playNotificationSound(severity);
  }

  async testSound(severity: LegacySeverity = 'WARNING'): Promise<void> {
    await this.playNotificationSound(severity);
  }

  /** Play a check-in style voice clip (used after the user logs an episode, etc.) */
  async playCheckIn(): Promise<void> {
    await audioAlertPlayer.playAlert('checkin');
  }

  setSoundEnabled(enabled: boolean): void {
    audioAlertPlayer.setSoundEnabled(enabled);
  }

  isSoundEnabled(): boolean {
    return audioAlertPlayer.isSoundEnabled();
  }
}

export const soundManager = SoundManager.getInstance();
