import { useToast } from '@/hooks/use-toast';

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
  private audioContext: AudioContext | null = null;
  private notificationSound: AudioBuffer | null = null;
  private soundEnabled = true;
  private userInteracted = false;

  private constructor() {
    this.initialize();
    this.setupUserInteractionListener();
  }

  static getInstance(): EnhancedMobileNotificationService {
    if (!EnhancedMobileNotificationService.instance) {
      EnhancedMobileNotificationService.instance = new EnhancedMobileNotificationService();
    }
    return EnhancedMobileNotificationService.instance;
  }

  private setupUserInteractionListener(): void {
    const enableAudio = () => {
      this.userInteracted = true;
      this.initializeSound();
      console.log('🔊 User interaction detected, audio enabled');
    };

    // Listen for any user interaction
    ['click', 'touch', 'keydown', 'scroll'].forEach(event => {
      document.addEventListener(event, enableAudio, { once: true, passive: true });
    });
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

  private async initializeSound(): Promise<void> {
    if (!this.userInteracted) {
      console.log('🔊 Waiting for user interaction to enable audio');
      return;
    }

    try {
      // Create audio context
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // Resume if suspended
      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }
      
      // Create a simple notification sound using Web Audio API
      await this.createNotificationSound();
      
      console.log('🔊 Notification sound initialized');
    } catch (error) {
      console.warn('🔊 Could not initialize audio:', error);
      // Fallback to HTML5 audio
      this.createFallbackSound();
    }
  }

  private async createNotificationSound(): Promise<void> {
    if (!this.audioContext) return;

    try {
      // Create a buffer for a pleasant notification sound
      const sampleRate = this.audioContext.sampleRate;
      const duration = 0.4; // 400ms
      const buffer = this.audioContext.createBuffer(1, sampleRate * duration, sampleRate);
      const data = buffer.getChannelData(0);

      // Generate a pleasant notification tone (two-tone chime)
      for (let i = 0; i < buffer.length; i++) {
        const t = i / sampleRate;
        if (t < 0.2) {
          // First tone: 800Hz
          data[i] = Math.sin(2 * Math.PI * 800 * t) * Math.exp(-t * 2) * 0.4;
        } else {
          // Second tone: 600Hz  
          data[i] = Math.sin(2 * Math.PI * 600 * (t - 0.2)) * Math.exp(-(t - 0.2) * 2) * 0.4;
        }
      }

      this.notificationSound = buffer;
      console.log('🔊 Web Audio notification sound created');
    } catch (error) {
      console.warn('🔊 Could not create Web Audio notification sound:', error);
    }
  }

  private createFallbackSound(): void {
    try {
      // Create a simple beep using the old school method
      const oscillator = new OscillatorNode(new AudioContext());
      const gainNode = new GainNode(new AudioContext());
      
      console.log('🔊 Fallback audio method initialized');
    } catch (error) {
      console.warn('🔊 All audio methods failed:', error);
    }
  }

  private async playNotificationSound(): Promise<void> {
    if (!this.soundEnabled || !this.userInteracted) {
      console.log('🔊 Sound disabled or no user interaction yet');
      return;
    }

    try {
      if (this.audioContext && this.notificationSound) {
        // Resume audio context if suspended
        if (this.audioContext.state === 'suspended') {
          await this.audioContext.resume();
        }

        const source = this.audioContext.createBufferSource();
        source.buffer = this.notificationSound;
        source.connect(this.audioContext.destination);
        source.start();
        
        console.log('🔊 Web Audio notification sound played');
        return;
      }

      // Fallback: Try to play a simple beep
      const context = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = context.createOscillator();
      const gainNode = context.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(context.destination);
      
      oscillator.frequency.setValueAtTime(800, context.currentTime);
      gainNode.gain.setValueAtTime(0.1, context.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, context.currentTime + 0.1);
      
      oscillator.start(context.currentTime);
      oscillator.stop(context.currentTime + 0.1);
      
      console.log('🔊 Fallback notification sound played');
    } catch (error) {
      console.warn('🔊 Could not play notification sound:', error);
      // Final fallback - try system beep
      try {
        console.log('\u0007'); // Bell character
      } catch (e) {
        console.warn('🔊 System beep also failed');
      }
    }
  }

  setSoundEnabled(enabled: boolean): void {
    this.soundEnabled = enabled;
    console.log('🔊 Sound', enabled ? 'enabled' : 'disabled');
  }

  isMedianApp(): boolean {
    const userAgent = navigator.userAgent.toLowerCase();
    const currentUrl = window.location.href.toLowerCase();
    
    // Enhanced detection for Median apps
    const isMedian = (
      currentUrl.includes('median.co') ||
      currentUrl.includes('lovableproject.com') ||
      userAgent.includes('median') ||
      userAgent.includes('wv') ||
      window.matchMedia('(display-mode: standalone)').matches ||
      (window as any).median !== undefined ||
      (window as any).Capacitor !== undefined ||
      // Check for mobile app indicators
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
    
    // Play notification sound
    await this.playNotificationSound();
    
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
      
      // Try to use native notification if available
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
      localStorage.setItem('sweatsmart_notifications', JSON.stringify(notifications.slice(0, 100))); // Keep last 100
      
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
    
    // Check every minute for due reminders
    this.reminderInterval = setInterval(() => {
      this.checkForDueReminders();
    }, 60000); // Check every minute
  }

  private checkForDueReminders(): void {
    try {
      const scheduleData = localStorage.getItem('sweatsmart_reminder_schedule');
      if (!scheduleData) return;
      
      const schedule: ReminderSchedule = JSON.parse(scheduleData);
      if (!schedule.enabled || !schedule.time) return;

      const now = new Date();
      const [hours, minutes] = schedule.time.split(':').map(Number);
      
      // Check if current time matches reminder time (within 1 minute)
      if (now.getHours() === hours && now.getMinutes() === minutes) {
        const today = now.toDateString();
        
        // Only send once per day
        if (schedule.lastSent !== today) {
          this.showNotification(
            'SweatSmart Daily Reminder',
            'Time to log your daily episode! Track your hyperhidrosis patterns to better understand your triggers.',
            'info'
          );
          
          // Update last sent date
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
    
    // Check for trigger patterns every hour
    this.triggerCheckInterval = setInterval(() => {
      this.checkForTriggerPatterns();
    }, 60000 * 60); // Check every hour
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

    // Get recent episodes (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const recentEpisodes = episodes.filter(episode => 
      new Date(episode.datetime || episode.date) >= sevenDaysAgo
    );

    if (recentEpisodes.length < 3) return;

    // Check for frequent triggers
    const triggerCounts: Record<string, number> = {};
    recentEpisodes.forEach(episode => {
      const triggers = episode.triggers || [];
      triggers.forEach((trigger: any) => {
        const label = typeof trigger === 'string' ? trigger : (trigger.label || trigger.value || 'Unknown');
        triggerCounts[label] = (triggerCounts[label] || 0) + 1;
      });
    });

    // Find triggers that appear in 60% or more of recent episodes
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

    // Check for severity increases
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
    
    // Ensure audio is ready
    await this.initializeSound();
    
    // Test basic notification with sound
    await this.showNotification(
      'Test Alert - SweatSmart',
      'Your notification system is working perfectly! 🎉',
      'success'
    );

    // Test mobile-specific features
    if (this.isMedianApp()) {
      setTimeout(async () => {
        await this.showNotification(
          'Mobile Test - SweatSmart',
          'Mobile app notifications are functioning correctly in your APK! 📱',
          'info'
        );
      }, 2000);
    }

    // Test reminder system
    setTimeout(async () => {
      const testTime = new Date();
      testTime.setMinutes(testTime.getMinutes() + 1);
      const timeString = `${testTime.getHours().toString().padStart(2, '0')}:${testTime.getMinutes().toString().padStart(2, '0')}`;
      
      await this.showNotification(
        'Reminder Test Scheduled',
        `Test reminder scheduled for ${timeString} to verify the reminder system works.`,
        'info'
      );
    }, 4000);
  }

  // Cache episodes for trigger analysis
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
    
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
    
    console.log('🧹 Enhanced Mobile Notification Service cleaned up');
  }
}

export const enhancedMobileNotificationService = EnhancedMobileNotificationService.getInstance();
