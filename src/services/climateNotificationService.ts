// services/climateNotificationService.ts
import { supabase } from '@/integrations/supabase/client';

interface WeatherData {
  temperature: number;
  humidity: number;
  uvIndex: number;
  feelsLike: number;
  description: string;
  location: string;
}

interface NotificationPreferences {
  enabled: boolean;
  temperatureThreshold: number;
  humidityThreshold: number;
  uvThreshold: number;
  quietHoursStart: string;
  quietHoursEnd: string;
  locationEnabled: boolean;
}

class ClimateNotificationService {
  private readonly WEATHER_API_KEY = import.meta.env.VITE_WEATHER_API_KEY;
  private readonly WEATHER_API_URL = 'https://api.openweathermap.org/data/2.5';
  private notificationCheckInterval: NodeJS.Timeout | null = null;

  /**
   * Get user's notification preferences - PUBLIC METHOD
   */
  async getUserPreferences(userId: string): Promise<NotificationPreferences> {
    const { data, error } = await supabase
      .from('notification_preferences')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error || !data) {
      // Return default preferences
      return {
        enabled: true,
        temperatureThreshold: 28,
        humidityThreshold: 70,
        uvThreshold: 6,
        quietHoursStart: '22:00',
        quietHoursEnd: '07:00',
        locationEnabled: true,
      };
    }

    return data as NotificationPreferences;
  }

  /**
   * Update user preferences - PUBLIC METHOD
   */
  async updatePreferences(
    userId: string,
    preferences: Partial<NotificationPreferences>
  ): Promise<void> {
    const { error } = await supabase
      .from('notification_preferences')
      .upsert({
        user_id: userId,
        ...preferences,
        updated_at: new Date().toISOString(),
      });

    if (error) {
      console.error('Error updating preferences:', error);
      throw error;
    }

    // Restart monitoring with new preferences
    this.stopMonitoring();
    const newPreferences = await this.getUserPreferences(userId);
    if (newPreferences.enabled) {
      this.startMonitoring(userId, newPreferences);
    }
  }

  /**
   * Initialize the climate notification service
   */
  async initialize(userId: string): Promise<void> {
    // Request notification permission
    await this.requestNotificationPermission();
    
    // Load user preferences
    const preferences = await this.getUserPreferences(userId);
    
    if (preferences.enabled) {
      this.startMonitoring(userId, preferences);
    }
  }

  /**
   * Request browser notification permission
   */
  private async requestNotificationPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      console.warn('Notifications not supported');
      return false;
    }

    if (Notification.permission === 'granted') {
      return true;
    }

    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }

    return false;
  }

  /**
   * Start monitoring weather conditions
   */
  private startMonitoring(userId: string, preferences: NotificationPreferences): void {
    // Check every 30 minutes
    this.notificationCheckInterval = setInterval(async () => {
      await this.checkWeatherAndNotify(userId, preferences);
    }, 30 * 60 * 1000);

    // Immediate first check
    this.checkWeatherAndNotify(userId, preferences);
  }

  /**
   * Stop monitoring
   */
  stopMonitoring(): void {
    if (this.notificationCheckInterval) {
      clearInterval(this.notificationCheckInterval);
      this.notificationCheckInterval = null;
    }
  }

  /**
   * Get current weather data
   */
  private async getWeatherData(lat: number, lon: number): Promise<WeatherData | null> {
    try {
      const response = await fetch(
        `${this.WEATHER_API_URL}/weather?lat=${lat}&lon=${lon}&units=metric&appid=${this.WEATHER_API_KEY}`
      );

      if (!response.ok) throw new Error('Weather API request failed');

      const data = await response.json();

      return {
        temperature: Math.round(data.main.temp),
        humidity: data.main.humidity,
        uvIndex: 0, // Need separate UV API call
        feelsLike: Math.round(data.main.feels_like),
        description: data.weather[0].description,
        location: data.name,
      };
    } catch (error) {
      console.error('Error fetching weather:', error);
      return null;
    }
  }

  /**
   * Get UV Index data
   */
  private async getUVIndex(lat: number, lon: number): Promise<number> {
    try {
      const response = await fetch(
        `${this.WEATHER_API_URL}/uvi?lat=${lat}&lon=${lon}&appid=${this.WEATHER_API_KEY}`
      );

      if (!response.ok) throw new Error('UV API request failed');

      const data = await response.json();
      return Math.round(data.value);
    } catch (error) {
      console.error('Error fetching UV index:', error);
      return 0;
    }
  }

  /**
   * Get user's location
   */
  private async getUserLocation(): Promise<{ lat: number; lon: number } | null> {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        resolve(null);
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            lat: position.coords.latitude,
            lon: position.coords.longitude,
          });
        },
        () => {
          // Fallback to Port Harcourt coordinates
          resolve({ lat: 4.8156, lon: 7.0498 });
        }
      );
    });
  }

  /**
   * Check if current time is within quiet hours
   */
  private isQuietHours(preferences: NotificationPreferences): boolean {
    const now = new Date();
    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    
    return currentTime >= preferences.quietHoursStart || currentTime <= preferences.quietHoursEnd;
  }

  /**
   * Check weather and send notification if needed
   */
  private async checkWeatherAndNotify(
    userId: string,
    preferences: NotificationPreferences
  ): Promise<void> {
    // Skip if in quiet hours
    if (this.isQuietHours(preferences)) {
      return;
    }

    // Get location
    const location = await this.getUserLocation();
    if (!location) return;

    // Get weather data
    const weather = await this.getWeatherData(location.lat, location.lon);
    if (!weather) return;

    // Get UV index
    weather.uvIndex = await this.getUVIndex(location.lat, location.lon);

    // Check thresholds and determine notification
    const triggers: string[] = [];

    if (weather.temperature >= preferences.temperatureThreshold) {
      triggers.push(`high temperature (${weather.temperature}°C)`);
    }

    if (weather.humidity >= preferences.humidityThreshold) {
      triggers.push(`high humidity (${weather.humidity}%)`);
    }

    if (weather.uvIndex >= preferences.uvThreshold) {
      triggers.push(`strong UV rays (index ${weather.uvIndex})`);
    }

    // Send notification if any triggers are active
    if (triggers.length > 0) {
      await this.sendNotification(userId, weather, triggers);
    }
  }

  /**
   * Send notification to user
   */
  private async sendNotification(
    userId: string,
    weather: WeatherData,
    triggers: string[]
  ): Promise<void> {
    // Check if we already sent a notification in the last hour
    const recentNotification = await this.getRecentNotification(userId);
    if (recentNotification) return;

    const title = '🌡️ Climate Alert - Time to Log Episode';
    const body = `Current conditions in ${weather.location}: ${triggers.join(', ')}. Consider logging your sweat episode.`;

    // Send browser notification
    if (Notification.permission === 'granted') {
      const notification = new Notification(title, {
        body,
        icon: '/icon-192x192.png',
        badge: '/badge-72x72.png',
        tag: 'climate-alert',
        requireInteraction: false,
        data: {
          weather,
          triggers,
          timestamp: new Date().toISOString(),
        },
      });

      notification.onclick = () => {
        window.focus();
        window.location.href = '/log-episode';
        notification.close();
      };
    }

    // Store notification in database
    await this.storeNotification(userId, title, body, weather, triggers);
  }

  /**
   * Check for recent notifications (within last hour)
   */
  private async getRecentNotification(userId: string): Promise<boolean> {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();

    const { data } = await supabase
      .from('climate_notifications')
      .select('id')
      .eq('user_id', userId)
      .gte('created_at', oneHourAgo)
      .limit(1);

    return (data?.length ?? 0) > 0;
  }

  /**
   * Store notification in database
   */
  private async storeNotification(
    userId: string,
    title: string,
    body: string,
    weather: WeatherData,
    triggers: string[]
  ): Promise<void> {
    await supabase.from('climate_notifications').insert({
      user_id: userId,
      title,
      body,
      weather_data: weather,
      triggers,
      read: false,
      created_at: new Date().toISOString(),
    });
  }

  /**
   * Get unread notifications count
   */
  async getUnreadCount(userId: string): Promise<number> {
    const { count } = await supabase
      .from('climate_notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('read', false);

    return count ?? 0;
  }

  /**
   * Get notification history
   */
  async getNotificationHistory(userId: string, limit = 20): Promise<any[]> {
    const { data, error } = await supabase
      .from('climate_notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching notifications:', error);
      return [];
    }

    return data ?? [];
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: string): Promise<void> {
    await supabase
      .from('climate_notifications')
      .update({ read: true })
      .eq('id', notificationId);
  }
}

export const climateNotificationService = new ClimateNotificationService();
