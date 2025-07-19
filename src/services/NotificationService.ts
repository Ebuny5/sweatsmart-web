
class NotificationService {
  private static instance: NotificationService;
  private reminderTimeouts: Set<NodeJS.Timeout> = new Set();

  private constructor() {
    // Don't auto-request on initialization
  }

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  async requestPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      console.warn('This browser does not support notifications');
      return false;
    }

    // Check current permission status
    let permission = Notification.permission;
    console.log('Current notification permission:', permission);

    if (permission === 'granted') {
      return true;
    }

    if (permission === 'denied') {
      console.warn('Notifications are denied by user - they need to manually enable in browser settings');
      return false;
    }

    try {
      // Request permission - this will show browser dialog
      permission = await Notification.requestPermission();
      console.log('Permission request result:', permission);
      
      // Force refresh the permission status
      setTimeout(() => {
        const newPermission = Notification.permission;
        console.log('Refreshed permission status:', newPermission);
      }, 1000);
      
      return permission === 'granted';
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  }

  getPermissionStatus(): 'granted' | 'denied' | 'default' | 'unsupported' {
    if (!('Notification' in window)) {
      return 'unsupported';
    }
    const status = Notification.permission;
    console.log('Getting permission status:', status);
    return status;
  }

  async showNotification(title: string, options?: NotificationOptions): Promise<boolean> {
    if (!('Notification' in window)) {
      console.warn('Notifications not supported');
      return false;
    }

    if (Notification.permission !== 'granted') {
      console.warn('Cannot show notification: permission not granted. Current status:', Notification.permission);
      return false;
    }

    try {
      const notification = new Notification(title, {
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        requireInteraction: true,
        ...options
      });

      notification.onclick = () => {
        window.focus();
        notification.close();
      };

      console.log('Notification shown successfully:', title);
      return true;
    } catch (error) {
      console.error('Error showing notification:', error);
      return false;
    }
  }

  scheduleReminder(time: string): void {
    console.log('Scheduling reminder for:', time);
    
    // Clear existing reminders
    this.clearReminders();

    const [hours, minutes] = time.split(':').map(Number);
    const now = new Date();
    const reminderTime = new Date();
    reminderTime.setHours(hours, minutes, 0, 0);

    // If the time has passed today, schedule for tomorrow
    if (reminderTime <= now) {
      reminderTime.setDate(reminderTime.getDate() + 1);
    }

    const timeUntilReminder = reminderTime.getTime() - now.getTime();
    console.log(`Reminder scheduled in ${Math.round(timeUntilReminder / 1000 / 60)} minutes`);

    const timeout = setTimeout(() => {
      this.showNotification('SweatSmart Reminder', {
        body: 'Time to log your daily episode! Track your hyperhidrosis patterns.',
        tag: 'daily-reminder'
      });
      
      // Schedule the next day's reminder
      this.scheduleReminder(time);
    }, timeUntilReminder);

    this.reminderTimeouts.add(timeout);
  }

  clearReminders(): void {
    this.reminderTimeouts.forEach(timeout => clearTimeout(timeout));
    this.reminderTimeouts.clear();
    console.log('All reminders cleared');
  }

  async checkTriggerAlerts(episodes: any[]): Promise<void> {
    if (episodes.length < 2) return;

    if (Notification.permission !== 'granted') {
      console.log('Cannot check trigger alerts: notifications not granted');
      return;
    }

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
      await this.showNotification('Pattern Alert - SweatSmart', {
        body: `Frequent trigger detected: ${frequentTriggers[0]}. Consider avoiding this trigger or preparing management strategies.`,
        tag: 'trigger-alert'
      });
    }

    // Check for severity increases
    const lastThreeEpisodes = recentEpisodes.slice(-3);
    if (lastThreeEpisodes.length === 3) {
      const severityTrend = lastThreeEpisodes.map(ep => ep.severity_level || ep.severity || 1);
      const isIncreasing = severityTrend[0] < severityTrend[1] && severityTrend[1] < severityTrend[2];
      
      if (isIncreasing) {
        await this.showNotification('Severity Alert - SweatSmart', {
          body: 'Your episode severity has been increasing. Consider consulting with a healthcare provider.',
          tag: 'severity-alert'
        });
      }
    }
  }

  // Test notification (for immediate testing)
  async testNotification(): Promise<boolean> {
    console.log('Testing notification...');
    return await this.showNotification('Test Notification - SweatSmart', {
      body: 'If you see this, notifications are working correctly!',
      tag: 'test'
    });
  }
}

export const notificationService = NotificationService.getInstance();
