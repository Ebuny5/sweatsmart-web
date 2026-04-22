
import { useToast } from '@/hooks/use-toast';

class MobileNotificationService {
  private static instance: MobileNotificationService;
  private reminderInterval: NodeJS.Timeout | null = null;
  private lastCheckTime: number = Date.now();

  private constructor() {
    this.startReminderChecker();
  }

  static getInstance(): MobileNotificationService {
    if (!MobileNotificationService.instance) {
      MobileNotificationService.instance = new MobileNotificationService();
    }
    return MobileNotificationService.instance;
  }

  // Enhanced mobile detection
  isMobileApp(): boolean {
    const userAgent = navigator.userAgent.toLowerCase();
    return (
      window.location.href.includes('lovableproject.com') ||
      window.location.href.includes('median.co') ||
      userAgent.includes('wv') ||
      userAgent.includes('median') ||
      window.matchMedia('(display-mode: standalone)').matches ||
      // @ts-ignore - Check for Median app specific properties
      window.median !== undefined ||
      // @ts-ignore - Check for Capacitor
      window.Capacitor !== undefined
    );
  }

  showMobileNotification(title: string, body: string, type: 'info' | 'success' | 'warning' | 'destructive' = 'info'): void {
    console.log(`📱 Mobile Notification [${type.toUpperCase()}]:`, title, body);
    
    // Store notification for display
    this.displayInAppNotification(title, body, type);
    
    // Store in localStorage for persistence
    const notifications = this.getStoredNotifications();
    notifications.push({
      id: Date.now().toString(),
      title,
      body,
      type,
      timestamp: new Date().toISOString(),
      read: false
    });
    localStorage.setItem('sweatsmart_notifications', JSON.stringify(notifications.slice(-50))); // Keep last 50
  }

  private displayInAppNotification(title: string, body: string, type: 'info' | 'success' | 'warning' | 'destructive'): void {
    // Create a custom event that components can listen to
    const event = new CustomEvent('sweatsmart-notification', {
      detail: { title, body, type }
    });
    window.dispatchEvent(event);
  }

  private getStoredNotifications(): any[] {
    try {
      const stored = localStorage.getItem('sweatsmart_notifications');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  scheduleReminder(time: string): void {
    console.log('📅 Mobile: Scheduling reminder for:', time);
    
    // Store reminder time
    localStorage.setItem('sweatsmart_reminder_time', time);
    localStorage.setItem('sweatsmart_reminder_enabled', 'true');
    
    this.showMobileNotification(
      'Reminder Set',
      `Daily reminders scheduled for ${time}`,
      'success'
    );
  }

  clearReminders(): void {
    localStorage.setItem('sweatsmart_reminder_enabled', 'false');
    console.log('📅 Mobile: All reminders cleared');
  }

  private startReminderChecker(): void {
    // Check every minute for due reminders
    this.reminderInterval = setInterval(() => {
      this.checkForDueReminders();
    }, 60000); // Check every minute
  }

  private checkForDueReminders(): void {
    const enabled = localStorage.getItem('sweatsmart_reminder_enabled') === 'true';
    const reminderTime = localStorage.getItem('sweatsmart_reminder_time');
    
    if (!enabled || !reminderTime) return;

    const now = new Date();
    const [hours, minutes] = reminderTime.split(':').map(Number);
    
    // Check if current time matches reminder time (within 1 minute)
    if (now.getHours() === hours && now.getMinutes() === minutes) {
      const lastReminder = localStorage.getItem('sweatsmart_last_reminder');
      const today = now.toDateString();
      
      // Only send once per day
      if (lastReminder !== today) {
        this.showMobileNotification(
          'SweatSmart Reminder',
          'Time to log your daily episode! Track your hyperhidrosis patterns.',
          'info'
        );
        localStorage.setItem('sweatsmart_last_reminder', today);
      }
    }
  }

  async checkTriggerAlerts(episodes: any[]): Promise<void> {
    if (episodes.length < 2) return;

    console.log('🔍 Mobile: Checking trigger patterns for', episodes.length, 'episodes');

    // Get recent episodes (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const recentEpisodes = episodes.filter(episode => 
      new Date(episode.datetime || episode.date) >= sevenDaysAgo
    );

    if (recentEpisodes.length < 3) return;

    // Check for patterns
    const triggerCounts: Record<string, number> = {};
    recentEpisodes.forEach(episode => {
      const triggers = episode.triggers || [];
      triggers.forEach((trigger: any) => {
        const label = typeof trigger === 'string' ? trigger : (trigger.label || trigger.value || 'Unknown');
        triggerCounts[label] = (triggerCounts[label] || 0) + 1;
      });
    });

    // Find frequent triggers (appeared in 60% or more of recent episodes)
    const frequentTriggers = Object.entries(triggerCounts)
      .filter(([_, count]) => count >= Math.ceil(recentEpisodes.length * 0.6))
      .map(([trigger]) => trigger);

    if (frequentTriggers.length > 0) {
      this.showMobileNotification(
        'Pattern Alert - SweatSmart',
        `Frequent trigger detected: ${frequentTriggers[0]}. Consider avoiding this trigger or preparing management strategies.`,
        'warning'
      );
    }

    // Check for severity increases
    const lastThreeEpisodes = recentEpisodes.slice(-3);
    if (lastThreeEpisodes.length === 3) {
      const severityTrend = lastThreeEpisodes.map(ep => ep.severity_level || ep.severity || 1);
      const isIncreasing = severityTrend[0] < severityTrend[1] && severityTrend[1] < severityTrend[2];
      
      if (isIncreasing) {
        this.showMobileNotification(
          'Severity Alert - SweatSmart',
          'Your episode severity has been increasing. Consider consulting with a healthcare provider.',
          'destructive'
        );
      }
    }
  }

  testNotification(): void {
    console.log('🧪 Mobile: Testing notification system...');
    this.showMobileNotification(
      'Test Alert - SweatSmart',
      'Your mobile alerts are working correctly! 🎉',
      'success'
    );
  }

  cleanup(): void {
    if (this.reminderInterval) {
      clearInterval(this.reminderInterval);
      this.reminderInterval = null;
    }
  }
}

export const mobileNotificationService = MobileNotificationService.getInstance();
