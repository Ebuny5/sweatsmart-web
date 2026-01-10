import { soundManager } from '@/utils/soundManager';
import { enhancedMobileNotificationService } from './EnhancedMobileNotificationService';

// Fixed 4-hour logging schedule (00:00, 04:00, 08:00, 12:00, 16:00, 20:00)
const LOG_BLOCKS = [0, 4, 8, 12, 16, 20];
const CHECK_INTERVAL = 60000; // Check every minute

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
    const now = new Date();
    const currentHour = now.getHours();
    
    // Find the next 4-hour block
    let nextBlockHour = LOG_BLOCKS.find(block => block > currentHour);
    
    // If no block found today, use first block of tomorrow
    const next = new Date(now);
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

    // Also try native notification directly
    if ('Notification' in window && Notification.permission === 'granted') {
      try {
        const notification = new Notification('⏰ Time to Log Your Episode', {
          body: 'Please record your sweat level for the last 4 hours.',
          icon: '/favicon.ico',
          badge: '/favicon.ico',
          tag: 'log-reminder',
          requireInteraction: true
        });

        notification.onclick = () => {
          window.focus();
          // Navigate to climate page
          window.location.href = '/climate';
          notification.close();
        };
      } catch (error) {
        console.error('📅 Native notification failed:', error);
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
