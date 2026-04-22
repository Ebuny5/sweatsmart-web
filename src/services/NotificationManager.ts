/**
 * NotificationManager — single pipeline for foreground / background / closed-app
 * alerts. Handles:
 *   - Deduplication (same dedupKey within cooldown window is skipped)
 *   - Per-channel cooldowns (climate vs reminder are independent)
 *   - Audio sequence: water sound → voice clip via AudioAlertPlayer
 *   - System notification via ServiceWorkerRegistration.showNotification (PWA-safe)
 *   - In-app toast event for foreground UI
 *
 * Climate alerts and log reminders are kept on SEPARATE cooldowns so they
 * never block each other.
 */

import { audioAlertPlayer, type AlertKind } from '@/utils/audioAlertPlayer';

export type NotificationChannel = 'climate' | 'reminder' | 'system';

export interface NotificationRequest {
  channel: NotificationChannel;
  kind: AlertKind;
  title: string;
  body: string;
  /** Stable key used for dedup. Same key inside cooldown is dropped. */
  dedupKey: string;
  /** Optional URL for tap action. */
  url?: string;
  /** Toast variant for in-app fallback. */
  toastVariant?: 'default' | 'destructive';
  /** Override the channel cooldown (ms). */
  cooldownMs?: number;
}

const DEFAULT_COOLDOWN_MS: Record<NotificationChannel, number> = {
  climate: 30 * 60 * 1000, // climate alerts: 30 minutes
  reminder: 15 * 60 * 1000, // reminders: 15 minutes
  system: 5 * 60 * 1000, // misc: 5 minutes
};

// Hard min-gap between ANY two alerts so they don't collide audibly.
const GLOBAL_MIN_GAP_MS = 8 * 1000;

const STORAGE_KEY = 'sweatsmart_notif_state_v1';

interface PersistedState {
  lastByKey: Record<string, number>;
  lastByChannel: Partial<Record<NotificationChannel, number>>;
  lastGlobal: number;
}

function readState(): PersistedState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { lastByKey: {}, lastByChannel: {}, lastGlobal: 0 };
    const parsed = JSON.parse(raw);
    return {
      lastByKey: parsed.lastByKey || {},
      lastByChannel: parsed.lastByChannel || {},
      lastGlobal: parsed.lastGlobal || 0,
    };
  } catch {
    return { lastByKey: {}, lastByChannel: {}, lastGlobal: 0 };
  }
}

function writeState(state: PersistedState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* ignore */
  }
}

class NotificationManager {
  private static instance: NotificationManager;

  static getInstance(): NotificationManager {
    if (!NotificationManager.instance) {
      NotificationManager.instance = new NotificationManager();
    }
    return NotificationManager.instance;
  }

  /**
   * Send a notification through the central pipeline.
   * Returns true if delivered, false if suppressed by dedup/cooldown.
   */
  async send(req: NotificationRequest): Promise<boolean> {
    const now = Date.now();
    const state = readState();
    const cooldown = req.cooldownMs ?? DEFAULT_COOLDOWN_MS[req.channel];

    // 1. Dedup by stable key
    const lastForKey = state.lastByKey[req.dedupKey] ?? 0;
    if (now - lastForKey < cooldown) {
      console.log(
        `🔕 [${req.channel}] suppressed dedup "${req.dedupKey}" (${Math.round(
          (cooldown - (now - lastForKey)) / 1000,
        )}s remaining)`,
      );
      return false;
    }

    // 2. Per-channel cooldown
    const lastForChannel = state.lastByChannel[req.channel] ?? 0;
    if (now - lastForChannel < cooldown / 2) {
      console.log(`🔕 [${req.channel}] suppressed (channel cooldown)`);
      return false;
    }

    // 3. Global min-gap so audio cues never overlap
    if (now - state.lastGlobal < GLOBAL_MIN_GAP_MS) {
      console.log(`🔕 [${req.channel}] suppressed (global min-gap)`);
      return false;
    }

    // ── Deliver ──
    state.lastByKey[req.dedupKey] = now;
    state.lastByChannel[req.channel] = now;
    state.lastGlobal = now;
    writeState(state);

    console.log(`🔔 [${req.channel}/${req.kind}] ${req.title} — ${req.body}`);

    // a) Audio (fire-and-forget)
    audioAlertPlayer.playAlert(req.kind).catch(() => {
      /* ignore audio errors */
    });

    // b) System notification via service worker (PWA-safe)
    void this.showSystemNotification(req);

    // c) In-app toast event for foreground listeners
    try {
      window.dispatchEvent(
        new CustomEvent('sweatsmart-notification', {
          detail: {
            title: req.title,
            body: req.body,
            type: req.toastVariant === 'destructive' ? 'destructive' : 'info',
          },
        }),
      );
    } catch {
      /* ignore */
    }

    return true;
  }

  private async showSystemNotification(req: NotificationRequest): Promise<void> {
    if (typeof window === 'undefined') return;
    if (!('serviceWorker' in navigator) || !('Notification' in window)) return;
    if (Notification.permission !== 'granted') return;

    try {
      const registration = await navigator.serviceWorker.ready;
      await registration.showNotification(req.title, {
        body: req.body,
        icon: '/icon-192.png',
        badge: '/icon-192.png',
        tag: `sweatsmart-${req.channel}-${req.kind}`,
        renotify: false,
        requireInteraction: req.kind === 'extreme',
        data: {
          url: req.url ?? '/',
          channel: req.channel,
          kind: req.kind,
        },
      } as NotificationOptions);
    } catch (err) {
      console.warn('System notification failed:', err);
    }
  }

  /** Reset all cooldown state. Used by Settings → "Reset alerts". */
  resetCooldowns(): void {
    writeState({ lastByKey: {}, lastByChannel: {}, lastGlobal: 0 });
  }
}

export const notificationManager = NotificationManager.getInstance();
