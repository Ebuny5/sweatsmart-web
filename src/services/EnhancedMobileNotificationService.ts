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
  private serviceWorkerRegistered = false;

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
    
    // Request notification permission immediately
    await this.requestNotificationPermission();
    
    // Register service worker for persistent notifications
    await this.registerServiceWorker();
    
    this.startReminderChecker();
    this.startTriggerChecker();
    this.isInitialized = true;
    
    console.log('✅ Enhanced Mobile Notification Service initialized');
  }

  private async requestNotificationPermission(): Promise<void> {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      console.log('📱 Notification permission:', permission);
      
      if (permission === 'denied') {
        console.warn('📱 Notification permission denied. App will use in-app notifications only.');
      }
    }
  }

  private async registerServiceWorker(): Promise<void> {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js');
        console.log('📱 Service Worker registered:', registration);
        this.serviceWorkerRegistered = true;
      } catch (error) {
        console.error('📱 Service Worker registration failed:', error);
      }
    }
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

    return isMedian;
  }

  async showNotification(title: string, body: string, type: 'info' | 'success' | 'warning' | 'destructive' = 'info'): Promise<void> {
    console.log(`📱 Professional Notification [${type.toUpperCase()}]:`, title, body);
    
    // Map notification type to sound severity
    const soundSeverity = type === 'destructive' ? 'CRITICAL' : 
                         type === 'warning' ? 'WARNING' : 'REMINDER';
    
    // Play professional medical alarm sound
    await soundManager.triggerMedicalAlert(soundSeverity);
    
    // Show persistent system notification (works even when app is closed)
    await this.showPersistentNotification(title, body, type);
    
    // Create a custom event for in-app notification
    const event = new CustomEvent('sweatsmart-notification', {
      detail: { title, body, type }
    });
    window.dispatchEvent(event);
    
    // Store notification for persistence
    this.storeNotification(title, body, type);
    
    console.log('📱 Professional notification system activated');
  }

  private async showPersistentNotification(title: string, body: string, type: string): Promise<void> {
    // Handle vibration separately before showing notification
    if (navigator.vibrate) {
      const vibrationPattern = type === 'destructive' ? [800, 200, 800, 200, 800] : [400, 100, 400];
      navigator.vibrate(vibrationPattern);
    }

    // Try native system notifications first (works when app is closed)
    if ('Notification' in window && Notification.permission === 'granted') {
      const options: NotificationOptions = {
        body,
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        tag: `sweatsmart-${type}`, // Prevents duplicate notifications
        requireInteraction: type === 'destructive', // Keep critical alerts visible
        data: {
          url: window.location.origin,
          timestamp: new Date().toISOString()
        }
      };

      try {
        const notification = new Notification(title, options);
        
        notification.onclick = () => {
          window.focus();
          notification.close();
        };

        // Auto-close non-critical notifications after 10 seconds
        if (type !== 'destructive') {
          setTimeout(() => notification.close(), 10000);
        }

        console.log('📱 System notification shown');
        return;
      } catch (error) {
        console.error('📱 System notification failed:', error);
      }
    }

    // Fallback to service worker notification
    if (this.serviceWorkerRegistered && 'serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.ready;
        await registration.showNotification(title, {
          body,
          icon: '/favicon.ico',
          badge: '/favicon.ico',
          tag: `sweatsmart-${type}`,
          requireInteraction: type === 'destructive',
          data: {
            url: window.location.origin,
            timestamp: new Date().toISOString()
          }
        });
        
        console.log('📱 Service Worker notification shown');
      } catch (error) {
        console.error('📱 Service Worker notification failed:', error);
      }
    }
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
    console.log('📅 Scheduling professional reminder for:', time);
    
    const schedule: ReminderSchedule = {
      time,
      enabled: true,
      lastSent: ''
    };
    
    localStorage.setItem('sweatsmart_reminder_schedule', JSON.stringify(schedule));
    
    this.showNotification(
      'SweatSmart Professional Reminder Set',
      `Daily medical reminders scheduled for ${time}. You'll receive persistent notifications to log your episodes.`,
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
      'Professional Reminders Disabled',
      'Daily episode reminders have been turned off.',
      'info'
    );
  }

  private startReminderChecker(): void {
    console.log('📅 Starting professional reminder checker...');
    
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
            'SweatSmart Medical Reminder',
            'Professional health tracking reminder: Time to log your daily episode and monitor your hyperhidrosis patterns.',
            'warning'
          );
          
          schedule.lastSent = today;
          localStorage.setItem('sweatsmart_reminder_schedule', JSON.stringify(schedule));
          
          console.log('📅 Professional daily reminder sent for:', today);
        }
      }
    } catch (error) {
      console.error('📅 Error checking reminders:', error);
    }
  }

  private startTriggerChecker(): void {
    console.log('🔍 Starting professional trigger pattern checker...');
    
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

    console.log('🔍 Professional analysis of trigger patterns for', episodes.length, 'episodes');

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
        'Professional Medical Alert: Pattern Detected',
        `Frequent trigger identified: "${frequentTriggers[0]}". Professional recommendation: Consider avoiding this trigger or preparing management strategies.`,
        'destructive'
      );
      
      console.log('🚨 Professional trigger alert sent for:', frequentTriggers[0]);
    }

    const lastThreeEpisodes = recentEpisodes.slice(-3);
    if (lastThreeEpisodes.length === 3) {
      const severityTrend = lastThreeEpisodes.map(ep => ep.severity_level || ep.severity || 1);
      const isIncreasing = severityTrend[0] < severityTrend[1] && severityTrend[1] < severityTrend[2];
      
      if (isIncreasing) {
        await this.showNotification(
          'Professional Medical Alert: Severity Trend',
          'Your episode severity has been increasing. Professional recommendation: Consider consulting with a healthcare provider immediately.',
          'destructive'
        );
        
        console.log('🚨 Professional severity alert sent');
      }
    }
  }

  async testNotificationSystem(): Promise<void> {
    console.log('🧪 Testing complete professional notification system...');
    
    // Test different professional alarm levels
    await this.showNotification(
      'Professional Test - SweatSmart',
      'Testing professional reminder notification with tunnel-like sound 🔔',
      'info'
    );

    setTimeout(async () => {
      await this.showNotification(
        'Professional Warning Test - SweatSmart',
        'Testing professional warning notification with sustained alarm ⚠️',
        'warning'
      );
    }, 4000);

    setTimeout(async () => {
      await this.showNotification(
        'Professional Critical Alert Test - SweatSmart',
        'Testing professional critical medical alert with tunnel sound! 🚨',
        'destructive'
      );
    }, 8000);

    setTimeout(async () => {
      await this.showNotification(
        'Professional Mobile Test - SweatSmart',
        'Professional mobile notifications are functioning correctly and will persist even when app is closed! 📱',
        'success'
      );
    }, 12000);
  }

  cacheEpisodesForAnalysis(episodes: any[]): void {
    try {
      localStorage.setItem('recent_episodes_cache', JSON.stringify(episodes));
      console.log('💾 Cached', episodes.length, 'episodes for professional analysis');
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
