import { soundManager } from '@/utils/soundManager';

interface NotificationData {
  id: string;
  title: string;
  body: string;
  type: 'info' | 'success' | 'warning' | 'destructive';
  timestamp: string;
  read: boolean;
}

interface ReminderSchedule {
  time: string;
  enabled: boolean;
  lastSent: string;
}

class EnhancedMobileNotificationService {
  private static instance: EnhancedMobileNotificationService;
  private reminderInterval: NodeJS.Timeout | null = null;
  private triggerCheckInterval: NodeJS.Timeout | null = null;
  private isInitialized = false;

  private constructor() {
    this.initialize();
  }

  static getInstance(): EnhancedMobileNotificationService {
    if (!EnhancedMobileNotificationService.instance) {
      EnhancedMobileNotificationService.instance = new EnhancedMobileNotificationService();
    }
    return EnhancedMobileNotificationService.instance;
  }

  private async initialize(): Promise<void> {
    if (this.isInitialized) return;
    
    console.log('🚀 Enhanced Mobile Notification Service initializing...');
    console.log('📱 Environment check:', {
      userAgent: navigator.userAgent,
      url: window.location.href,
      isMedian: this.isMedianApp(),
      isStandalone: window.matchMedia('(display-mode: standalone)').matches
    });

    this.startReminderChecker();
    this.startTriggerChecker();
    this.isInitialized = true;
    
    console.log('✅ Enhanced Mobile Notification Service initialized');
  }

  setSoundEnabled(enabled: boolean): void {
    soundManager.setSoundEnabled(enabled);
  }

  isMedianApp(): boolean {
    const userAgent = navigator.userAgent.toLowerCase();
    const currentUrl = window.location.href.toLowerCase();
    
    const isMedian = (
      currentUrl.includes('median.co') ||
      currentUrl.includes('lovableproject.com') ||
      userAgent.includes('median') ||
      userAgent.includes('wv') ||
      window.matchMedia('(display-mode: standalone)').matches ||
      (window as any).median !== undefined ||
      (window as any).Capacitor !== undefined ||
      userAgent.includes('mobile') && !userAgent.includes('safari')
    );

    console.log('📱 Mobile app detection:', {
      isMedian,
      currentUrl,
      userAgent: userAgent.substring(0, 100) + '...'
    });

    return isMedian;
  }

  async showNotification(title: string, body: string, type: 'info' | 'success' | 'warning' | 'destructive' = 'info'): Promise<void> {
    console.log(`📱 Mobile Notification [${type.toUpperCase()}]:`, title, body);
    
    // Map notification type to sound severity
    const soundSeverity = type === 'destructive' ? 'CRITICAL' : 
                         type === 'warning' ? 'WARNING' : 'REMINDER';
    
    // Play appropriate medical alarm sound
    await soundManager.triggerMedicalAlert(soundSeverity);
    
    // Create a custom event that the NotificationListener can catch
    const event = new CustomEvent('sweatsmart-notification', {
      detail: { title, body, type }
    });
    window.dispatchEvent(event);
    
    // Store notification for persistence
    this.storeNotification(title, body, type);
    
    // Additional mobile-specific handling
    if (this.isMedianApp()) {
      console.log('📱 APK: Notification triggered in mobile app environment');
      this.tryNativeNotification(title, body);
    }
  }

  private tryNativeNotification(title: string, body: string): void {
    // Try Median native notifications
    if ((window as any).median?.notification) {
      try {
        (window as any).median.notification.show({
          title,
          body,
          badge: '/favicon.ico'
        });
        console.log('📱 Native notification sent via Median');
        return;
      } catch (error) {
        console.log('📱 Median notification failed:', error);
      }
    }

    // Try Capacitor notifications
    if ((window as any).Capacitor?.Plugins?.LocalNotifications) {
      try {
        (window as any).Capacitor.Plugins.LocalNotifications.schedule({
          notifications: [{
            title,
            body,
            id: Date.now(),
            schedule: { at: new Date(Date.now() + 1000) }
          }]
        });
        console.log('📱 Native notification sent via Capacitor');
        return;
      } catch (error) {
        console.log('📱 Capacitor notification failed:', error);
      }
    }

    console.log('📱 No native notification API available, using in-app toast');
  }

  private storeNotification(title: string, body: string, type: string): void {
    try {
      const notifications = this.getStoredNotifications();
      const newNotification: NotificationData = {
        id: Date.now().toString(),
        title,
        body,
        type: type as 'info' | 'success' | 'warning' | 'destructive',
        timestamp: new Date().toISOString(),
        read: false
      };
      
      notifications.unshift(newNotification);
      localStorage.setItem('sweatsmart_notifications', JSON.stringify(notifications.slice(0, 100)));
      
      console.log('💾 Notification stored:', newNotification.id);
    } catch (error) {
      console.error('💾 Failed to store notification:', error);
    }
  }

  getStoredNotifications(): NotificationData[] {
    try {
      const stored = localStorage.getItem('sweatsmart_notifications');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  scheduleReminder(time: string): void {
    console.log('📅 Scheduling reminder for:', time);
    
    const schedule: ReminderSchedule = {
      time,
      enabled: true,
      lastSent: ''
    };
    
    localStorage.setItem('sweatsmart_reminder_schedule', JSON.stringify(schedule));
    
    this.showNotification(
      'Reminder Scheduled',
      `Daily reminders set for ${time}. You'll get notifications to log your episodes.`,
      'success'
    );
  }

  clearReminders(): void {
    const schedule: ReminderSchedule = {
      time: '',
      enabled: false,
      lastSent: ''
    };
    
    localStorage.setItem('sweatsmart_reminder_schedule', JSON.stringify(schedule));
    console.log('📅 All reminders cleared');
    
    this.showNotification(
      'Reminders Disabled',
      'Daily episode reminders have been turned off.',
      'info'
    );
  }

  private startReminderChecker(): void {
    console.log('📅 Starting reminder checker...');
    
    this.reminderInterval = setInterval(() => {
      this.checkForDueReminders();
    }, 60000);
  }

  private checkForDueReminders(): void {
    try {
      const scheduleData = localStorage.getItem('sweatsmart_reminder_schedule');
      if (!scheduleData) return;
      
      const schedule: ReminderSchedule = JSON.parse(scheduleData);
      if (!schedule.enabled || !schedule.time) return;

      const now = new Date();
      const [hours, minutes] = schedule.time.split(':').map(Number);
      
      if (now.getHours() === hours && now.getMinutes() === minutes) {
        const today = now.toDateString();
        
        if (schedule.lastSent !== today) {
          this.showNotification(
            'SweatSmart Daily Reminder',
            'Time to log your daily episode! Track your hyperhidrosis patterns to better understand your triggers.',
            'info'
          );
          
          schedule.lastSent = today;
          localStorage.setItem('sweatsmart_reminder_schedule', JSON.stringify(schedule));
          
          console.log('📅 Daily reminder sent for:', today);
        }
      }
    } catch (error) {
      console.error('📅 Error checking reminders:', error);
    }
  }

  private startTriggerChecker(): void {
    console.log('🔍 Starting trigger pattern checker...');
    
    this.triggerCheckInterval = setInterval(() => {
      this.checkForTriggerPatterns();
    }, 60000 * 60);
  }

  private checkForTriggerPatterns(): void {
    try {
      const episodesData = localStorage.getItem('recent_episodes_cache');
      if (!episodesData) return;
      
      const episodes = JSON.parse(episodesData);
      this.analyzeAndAlertTriggers(episodes);
    } catch (error) {
      console.error('🔍 Error checking trigger patterns:', error);
    }
  }

  async analyzeAndAlertTriggers(episodes: any[]): Promise<void> {
    if (episodes.length < 3) return;

    console.log('🔍 Analyzing trigger patterns for', episodes.length, 'episodes');

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const recentEpisodes = episodes.filter(episode => 
      new Date(episode.datetime || episode.date) >= sevenDaysAgo
    );

    if (recentEpisodes.length < 3) return;

    const triggerCounts: Record<string, number> = {};
    recentEpisodes.forEach(episode => {
      const triggers = episode.triggers || [];
      triggers.forEach((trigger: any) => {
        const label = typeof trigger === 'string' ? trigger : (trigger.label || trigger.value || 'Unknown');
        triggerCounts[label] = (triggerCounts[label] || 0) + 1;
      });
    });

    const threshold = Math.ceil(recentEpisodes.length * 0.6);
    const frequentTriggers = Object.entries(triggerCounts)
      .filter(([_, count]) => count >= threshold)
      .map(([trigger]) => trigger);

    if (frequentTriggers.length > 0) {
      await this.showNotification(
        'Pattern Alert Detected',
        `Frequent trigger detected: "${frequentTriggers[0]}". Consider avoiding this trigger or preparing management strategies.`,
        'warning'
      );
      
      console.log('🚨 Trigger alert sent for:', frequentTriggers[0]);
    }

    const lastThreeEpisodes = recentEpisodes.slice(-3);
    if (lastThreeEpisodes.length === 3) {
      const severityTrend = lastThreeEpisodes.map(ep => ep.severity_level || ep.severity || 1);
      const isIncreasing = severityTrend[0] < severityTrend[1] && severityTrend[1] < severityTrend[2];
      
      if (isIncreasing) {
        await this.showNotification(
          'Severity Trend Alert',
          'Your episode severity has been increasing over the last few days. Consider consulting with a healthcare provider.',
          'destructive'
        );
        
        console.log('🚨 Severity alert sent');
      }
    }
  }

  async testNotificationSystem(): Promise<void> {
    console.log('🧪 Testing complete notification system...');
    
    // Test different alarm levels
    await this.showNotification(
      'Test Reminder - SweatSmart',
      'Testing gentle reminder sound 🔔',
      'info'
    );

    setTimeout(async () => {
      await this.showNotification(
        'Test Warning - SweatSmart',
        'Testing warning alarm sound ⚠️',
        'warning'
      );
    }, 3000);

    setTimeout(async () => {
      await this.showNotification(
        'Test Critical Alert - SweatSmart',
        'Testing critical medical alarm! 🚨',
        'destructive'
      );
    }, 6000);

    if (this.isMedianApp()) {
      setTimeout(async () => {
        await this.showNotification(
          'Mobile Test - SweatSmart',
          'Mobile app notifications are functioning correctly! 📱',
          'success'
        );
      }, 9000);
    }
  }

  cacheEpisodesForAnalysis(episodes: any[]): void {
    try {
      localStorage.setItem('recent_episodes_cache', JSON.stringify(episodes));
      console.log('💾 Cached', episodes.length, 'episodes for trigger analysis');
    } catch (error) {
      console.error('💾 Failed to cache episodes:', error);
    }
  }

  cleanup(): void {
    if (this.reminderInterval) {
      clearInterval(this.reminderInterval);
      this.reminderInterval = null;
    }
    
    if (this.triggerCheckInterval) {
      clearInterval(this.triggerCheckInterval);
      this.triggerCheckInterval = null;
    }
    
    console.log('🧹 Enhanced Mobile Notification Service cleaned up');
  }
}

export const enhancedMobileNotificationService = EnhancedMobileNotificationService.getInstance();
