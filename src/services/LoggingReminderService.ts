import { notificationManager } from './NotificationManager';

// Production mode: 4-hour blocks
const TESTING_MODE = false;
const TEST_INTERVAL_MS = 10 * 60 * 1000; // (kept for reference)
const PRODUCTION_INTERVAL_MS = 4 * 60 * 60 * 1000; // 4 hours

class LoggingReminderService {
  private static instance: LoggingReminderService;
  private dueTimeout: number | null = null;
  private isInitialized = false;

  private handleVisibilityChange = () => {
    // Android aggressively throttles timers in background; catch up on resume.
    if (document.visibilityState === 'visible') {
      this.forceCheck();
      this.scheduleNextWakeup();
    }
  };

  private constructor() {
    this.initialize();
  }

  static getInstance(): LoggingReminderService {
    if (!LoggingReminderService.instance) {
      LoggingReminderService.instance = new LoggingReminderService();
    }
    return LoggingReminderService.instance;
  }

  private async initialize(): Promise<void> {
    if (this.isInitialized) return;

    console.log('📅 Logging Reminder Service initializing...');

    // Register periodic background sync (best-effort; often denied/unsupported on Android)
    await this.registerPeriodicSync();

    // Register regular background sync (fires on connectivity changes, not on a timer)
    await this.registerBackgroundSync();

    this.startLogChecker();
    this.isInitialized = true;
    console.log('✅ Logging Reminder Service initialized');

    // Sync initial next log time with service worker
    const nextLogTime = this.getNextScheduledTime();
    if (nextLogTime) {
      this.syncWithServiceWorker(nextLogTime);
    }
  }

  private async registerPeriodicSync(): Promise<void> {
    try {
      if (!('serviceWorker' in navigator) || !('periodicSync' in (await navigator.serviceWorker.ready))) {
        console.log('📅 Periodic background sync not supported');
        return;
      }

      // Check permission
      const permission = await navigator.permissions.query({
        name: 'periodic-background-sync' as PermissionName,
      });

      if (permission.state === 'granted') {
        const registration = await navigator.serviceWorker.ready;

        // Register periodic sync for log reminders
        await (registration as any).periodicSync.register('sweatsmart-log-check', {
          minInterval: TESTING_MODE ? TEST_INTERVAL_MS : PRODUCTION_INTERVAL_MS,
        });

        console.log('✅ Periodic background sync registered');
      } else {
        console.log('📅 Periodic background sync permission not granted:', permission.state);
      }
    } catch (error) {
      console.log('📅 Periodic background sync registration failed:', error);
    }
  }

  private async registerBackgroundSync(): Promise<void> {
    try {
      if (!('serviceWorker' in navigator) || !('SyncManager' in window)) {
        console.log('📅 Background sync not supported');
        return;
      }

      const registration = await navigator.serviceWorker.ready;
      await (registration as any).sync.register('sweatsmart-log-reminder');
      console.log('✅ Background sync registered');
    } catch (error) {
      console.log('📅 Background sync registration failed:', error);
    }
  }

  private syncWithServiceWorker(nextLogTime: number): void {
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: 'SYNC_LOG_REMINDER',
        nextLogTime,
      });
      console.log('📅 Synced log reminder with service worker:', new Date(nextLogTime).toLocaleString());
    }
  }

  private startLogChecker(): void {
    document.addEventListener('visibilitychange', this.handleVisibilityChange);

    // Initial check + schedule an exact wakeup for the next log time
    this.checkForDueLog();
    this.scheduleNextWakeup();
  }

  private scheduleNextWakeup(): void {
    if (this.dueTimeout) {
      window.clearTimeout(this.dueTimeout);
      this.dueTimeout = null;
    }

    const nextLogTime = this.getNextScheduledTime();
    if (!nextLogTime) return;

    const delayMs = Math.max(1000, nextLogTime - Date.now() + 250);

    this.dueTimeout = window.setTimeout(() => {
      this.checkForDueLog();
      this.scheduleNextWakeup();
    }, delayMs);
  }

  private getNextLogTime(): number {
    const now = Date.now();
    
    if (TESTING_MODE) {
      // Testing: next log in 10 minutes from now
      return now + TEST_INTERVAL_MS;
    }
    
    // Production: Fixed 4-hour blocks (00:00, 04:00, 08:00, 12:00, 16:00, 20:00)
    const LOG_BLOCKS = [0, 4, 8, 12, 16, 20];
    const currentDate = new Date();
    const currentHour = currentDate.getHours();
    
    let nextBlockHour = LOG_BLOCKS.find(block => block > currentHour);
    
    const next = new Date(currentDate);
    if (nextBlockHour === undefined) {
      next.setDate(next.getDate() + 1);
      nextBlockHour = 0;
    }
    
    next.setHours(nextBlockHour, 0, 0, 0);
    return next.getTime();
  }

  private checkForDueLog(): void {
    try {
      const storedNextLogTime = localStorage.getItem('climateNextLogTime');
      if (!storedNextLogTime) {
        // Initialize if not set
        const nextTime = this.getNextLogTime();
        localStorage.setItem('climateNextLogTime', nextTime.toString());
        console.log('📅 Initial next log time set:', new Date(nextTime).toLocaleString());

        this.syncWithServiceWorker(nextTime);
        this.scheduleNextWakeup();
        return;
      }

      const nextLogTime = parseInt(storedNextLogTime, 10);
      const now = Date.now();

      // Check if it's time to log
      if (now >= nextLogTime) {
        const lastAlertTime = localStorage.getItem('lastLogAlertTime');
        const lastAlert = lastAlertTime ? parseInt(lastAlertTime, 10) : 0;

        // Only send alert once per logging window (within 5 minutes of the log time)
        if (now - lastAlert > 5 * 60 * 1000) {
          void this.sendLogReminder();
          localStorage.setItem('lastLogAlertTime', now.toString());

          // Update to next log time
          const newNextTime = this.getNextLogTime();
          localStorage.setItem('climateNextLogTime', newNextTime.toString());
          console.log('📅 Next log time updated to:', new Date(newNextTime).toLocaleString());

          // Sync with service worker
          this.syncWithServiceWorker(newNextTime);
        }
      }

      this.scheduleNextWakeup();
    } catch (error) {
      console.error('📅 Error checking for due log:', error);
    }
  }


  private async sendLogReminder(): Promise<void> {
    console.log('📅 Sending log reminder via NotificationManager...');

    // Single pipeline: dedup, cooldown, water-sound + voice, system notif, in-app toast.
    const delivered = await notificationManager.send({
      channel: 'reminder',
      kind: 'reminder',
      title: '⏰ Time to Log Your Episode',
      body: 'Please record your sweat level for the last 4 hours. Tap to log your episode.',
      // Hour-bucketed dedup so we never double-fire within the same hour
      dedupKey: `log-reminder:${new Date().toISOString().slice(0, 13)}`,
      url: '/log-episode',
    });

    if (delivered) {
      try {
        await this.setAppBadge(1);
      } catch (error) {
        console.warn('📅 Badging failed:', error);
      }

      window.dispatchEvent(
        new CustomEvent('sweatsmart-log-reminder', {
          detail: { timestamp: Date.now() },
        }),
      );
    }
  }

  private async setAppBadge(count: number): Promise<void> {
    try {
      if ('setAppBadge' in navigator) {
        await (navigator as any).setAppBadge(count);
        console.log('🔴 App badge set to:', count);
      }
      
      // Also tell service worker
      if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({
          type: 'SET_BADGE',
          count
        });
      }
    } catch (error) {
      console.log('🔴 Badging not supported:', error);
    }
  }
  
  async clearAppBadge(): Promise<void> {
    try {
      if ('clearAppBadge' in navigator) {
        await (navigator as any).clearAppBadge();
        console.log('🔴 App badge cleared');
      } else if ('setAppBadge' in navigator) {
        await (navigator as any).setAppBadge(0);
      }
      
      // Also tell service worker
      if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({
          type: 'CLEAR_BADGE'
        });
      }
    } catch (error) {
      console.log('🔴 Badging not supported:', error);
    }
  }

  getNextScheduledTime(): number | null {
    const stored = localStorage.getItem('climateNextLogTime');
    return stored ? parseInt(stored, 10) : null;
  }

  forceCheck(): void {
    console.log('📅 Forcing log check...');
    this.checkForDueLog();
  }

  cleanup(): void {
    if (this.dueTimeout) {
      window.clearTimeout(this.dueTimeout);
      this.dueTimeout = null;
    }

    document.removeEventListener('visibilitychange', this.handleVisibilityChange);
    console.log('🧹 Logging Reminder Service cleaned up');
  }
}

export const loggingReminderService = LoggingReminderService.getInstance();
