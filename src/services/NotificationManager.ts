/**
 * NotificationManager — single web-first pipeline for alerts.
 * Handles:
 *   - Web/PWA notifications
 *   - Deduplication (same dedupKey within cooldown window is skipped)
 *   - Per-channel cooldowns (climate vs reminder are independent)
 *   - Audio sequence: water sound → voice clip via AudioAlertPlayer
 *   - In-app toast event for foreground UI
 *   - Centralized click navigation logic
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
  /** Optional URL for tap action. Defaults to '/' or '/log-episode' for reminders. */
  url?: string;
  /** Toast variant for in-app fallback. */
  toastVariant?: 'default' | 'destructive';
  /** Override the channel cooldown (ms). */
  cooldownMs?: number;
}

const DEFAULT_COOLDOWN_MS: Record<NotificationChannel, number> = {
  climate: 30 * 60 * 1000, // climate alerts: 30 minutes
  reminder: 15 * 60 * 1000, // reminders: 15 minutes
  system: 0, // system/test: always fire
};

// Hard min-gap between ANY two alerts so they don't collide audibly.
const GLOBAL_MIN_GAP_MS = 8 * 1000;

const STORAGE_KEY = 'sweatsmart_notif_state_v2';
const BG_ENABLED_KEY = 'sweatsmart_bg_notifications_enabled';

export function isBackgroundNotificationsEnabled(): boolean {
  try {
    const v = localStorage.getItem(BG_ENABLED_KEY);
    if (v === null) return true;
    return JSON.parse(v) !== false;
  } catch {
    return true;
  }
}

export function setBackgroundNotificationsEnabled(enabled: boolean): void {
  try {
    localStorage.setItem(BG_ENABLED_KEY, JSON.stringify(enabled));
  } catch {
    /* ignore */
  }
}

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

  private constructor() {
    this.initClickListeners();
  }

  /**
   * Request permission for native notifications.
   */
  async requestPermission(): Promise<boolean> {
    if (typeof Notification !== 'undefined') {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }
    return false;
  }

  async getPermissionStatus(): Promise<'granted' | 'denied' | 'prompt' | 'prompt-with-rationale'> {
    if (typeof Notification !== 'undefined') {
      return Notification.permission === 'default' ? 'prompt' : Notification.permission;
    }
    return 'denied';
  }

  static getInstance(): NotificationManager {
    if (!NotificationManager.instance) {
      NotificationManager.instance = new NotificationManager();
    }
    return NotificationManager.instance;
  }

  private initClickListeners() {
    // Native click listeners handled via standard Notification API
  }

  /**
   * Send a notification through the central pipeline.
   * Returns true if delivered, false if suppressed by dedup/cooldown.
   */
  async send(req: NotificationRequest): Promise<boolean> {
    const now = Date.now();
    const state = readState();
    const cooldown = req.cooldownMs ?? DEFAULT_COOLDOWN_MS[req.channel];

    // Bypass cooldowns for system channel (used for testing)
    const isTest = req.channel === 'system';

    if (!isTest) {
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

    // b) System notification (Web API)
    void this.showSystemNotification(req);

    // c) In-app toast event for foreground listeners
    try {
      window.dispatchEvent(
        new CustomEvent('sweatsmart-notification', {
          detail: {
            title: req.title,
            body: req.body,
            type: req.toastVariant === 'destructive' ? 'destructive' : 'info',
            channel: req.channel,
          },
        }),
      );
    } catch {
      /* ignore */
    }

    return true;
  }

  /**
   * Web-first reminder note. Closed-app reminders are handled by Web Push CRON,
   * not Capacitor LocalNotifications.
   */
  async scheduleReminder(at: Date, title: string, body: string, url: string): Promise<void> {
    if (!isBackgroundNotificationsEnabled()) {
      console.log('🔕 Background notifications disabled — skipping scheduleReminder');
      return;
    }
    console.log('📅 Reminder timing tracked locally; closed-app delivery uses Web Push CRON:', at.toLocaleString(), title, body, url);
  }

  private async showSystemNotification(req: NotificationRequest): Promise<void> {
    if (typeof window === 'undefined') return;

    // Respect the user's "Background Notifications" toggle.
    if (!isBackgroundNotificationsEnabled()) {
      console.log('🔕 Background notifications disabled in settings — skipping system notification');
      return;
    }

    // Web/PWA fallback — only if the page is hidden, otherwise the
    // foreground audio + toast already covers it.
    try {
      if (
        typeof Notification !== 'undefined' &&
        Notification.permission === 'granted' &&
        document.visibilityState !== 'visible'
      ) {
        const notification = new Notification(req.title, { body: req.body, tag: req.dedupKey });
        notification.onclick = () => {
          window.focus();
          window.location.href = req.url || '/';
        };
      }
    } catch (err) {
      console.warn('Web notification failed:', err);
    }
  }

  /** Reset all cooldown state. Used by Settings → "Reset alerts". */
  resetCooldowns(): void {
    writeState({ lastByKey: {}, lastByChannel: {}, lastGlobal: 0 });
  }
}

export const notificationManager = NotificationManager.getInstance();
