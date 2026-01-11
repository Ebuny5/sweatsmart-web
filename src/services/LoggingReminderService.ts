import { soundManager } from '@/utils/soundManager';
import { enhancedMobileNotificationService } from './EnhancedMobileNotificationService';

// Testing mode: 10-minute interval (set to false for production 4-hour blocks)
const TESTING_MODE = true;
const TEST_INTERVAL_MS = 10 * 60 * 1000; // 10 minutes for testing
const CHECK_INTERVAL = 30000; // Check every 30 seconds for faster response

class LoggingReminderService {
  private static instance: LoggingReminderService;
  private checkInterval: NodeJS.Timeout | null = null;
  private isInitialized = false;

  private constructor() {
    this.initialize();
  }

  static getInstance(): LoggingReminderService {
    if (!LoggingReminderService.instance) {
      LoggingReminderService.instance = new LoggingReminderService();
    }
    return LoggingReminderService.instance;
  }

  private initialize(): void {
    if (this.isInitialized) return;
    
    console.log('📅 Logging Reminder Service initializing...');
    this.startLogChecker();
    this.isInitialized = true;
    console.log('✅ Logging Reminder Service initialized');
    
    // Sync initial next log time with service worker
    const nextLogTime = this.getNextScheduledTime();
    if (nextLogTime) {
      this.syncWithServiceWorker(nextLogTime);
    }
  }
  
  private syncWithServiceWorker(nextLogTime: number): void {
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: 'SYNC_LOG_REMINDER',
        nextLogTime
      });
      console.log('📅 Synced log reminder with service worker:', new Date(nextLogTime).toLocaleString());
    }
  }

  private startLogChecker(): void {
    // Initial check
    this.checkForDueLog();

    // Check every minute
    this.checkInterval = setInterval(() => {
      this.checkForDueLog();
    }, CHECK_INTERVAL);
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
          this.sendLogReminder();
          localStorage.setItem('lastLogAlertTime', now.toString());
          
          // Update to next log time
          const newNextTime = this.getNextLogTime();
          localStorage.setItem('climateNextLogTime', newNextTime.toString());
          console.log('📅 Next log time updated to:', new Date(newNextTime).toLocaleString());
          
          // Sync with service worker
          this.syncWithServiceWorker(newNextTime);
        }
      }
    } catch (error) {
      console.error('📅 Error checking for due log:', error);
    }
  }

  private async sendLogReminder(): Promise<void> {
    console.log('📅 Sending log reminder notification...');

    // Play reminder sound
    await soundManager.triggerMedicalAlert('REMINDER');

    // Show notification through enhanced service
    await enhancedMobileNotificationService.showNotification(
      '⏰ Time to Log Your Episode',
      'Please record your sweat level for the last 4 hours. Open Climate Alerts to log.',
      'warning'
    );

    // Use ServiceWorkerRegistration.showNotification() for PWA compatibility
    // Direct new Notification() fails on Android PWAs
    if ('serviceWorker' in navigator && 'Notification' in window && Notification.permission === 'granted') {
      try {
        const registration = await navigator.serviceWorker.ready;
        await registration.showNotification('⏰ Time to Log Your Episode', {
          body: 'Please record your sweat level for the last 4 hours.',
          icon: '/favicon.ico',
          badge: '/favicon.ico',
          tag: 'log-reminder',
          requireInteraction: true,
          data: { url: '/climate' }
        });
        console.log('📅 Service Worker notification shown');
      } catch (error) {
        console.error('📅 Service Worker notification failed:', error);
      }
    }

    // Dispatch custom event for in-app handling
    const event = new CustomEvent('sweatsmart-log-reminder', {
      detail: { timestamp: Date.now() }
    });
    window.dispatchEvent(event);
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
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
    console.log('🧹 Logging Reminder Service cleaned up');
  }
}

export const loggingReminderService = LoggingReminderService.getInstance();
