/**
 * ClimateNotificationService - Real-time weather monitoring for hyperhidrosis episode alerts
 * Uses OpenWeatherMap API for accurate weather data
 */

interface ClimateSettings {
  enabled: boolean;
  temperatureThreshold: number;
  humidityThreshold: number;
  uvThreshold: number;
  quietHoursStart: string;
  quietHoursEnd: string;
  locationEnabled: boolean;
}

interface WeatherData {
  temperature: number;
  humidity: number;
  uvIndex: number;
  description: string;
}

class ClimateNotificationService {
  private static instance: ClimateNotificationService;
  private checkInterval: NodeJS.Timeout | null = null;
  private lastNotificationTime: number = 0;
  private readonly NOTIFICATION_COOLDOWN = 4 * 60 * 60 * 1000; // 4 hours
  private readonly CHECK_INTERVAL = 30 * 60 * 1000; // Check every 30 minutes
  
  // Using OpenWeatherMap free tier API
  private readonly WEATHER_API_KEY = 'da885c59976d67ec00d9e44a3b3f15f5'; // Free tier key for SweatSmart
  private readonly WEATHER_API_BASE = 'https://api.openweathermap.org/data/2.5';

  private constructor() {
    console.log('🌡️ ClimateNotificationService initialized');
  }

  static getInstance(): ClimateNotificationService {
    if (!ClimateNotificationService.instance) {
      ClimateNotificationService.instance = new ClimateNotificationService();
    }
    return ClimateNotificationService.instance;
  }

  /**
   * Start monitoring climate conditions
   */
  startMonitoring(settings?: Partial<ClimateSettings>): void {
    console.log('🌡️ Starting climate monitoring...');
    
    // Update settings if provided
    if (settings) {
      const currentSettings = this.getSettings();
      const updatedSettings = { ...currentSettings, ...settings };
      localStorage.setItem('climate_settings', JSON.stringify(updatedSettings));
    }
    
    // Initial check
    this.checkClimateConditions();
    
    // Set up periodic checks
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
    }
    
    this.checkInterval = setInterval(() => {
      this.checkClimateConditions();
    }, this.CHECK_INTERVAL);
  }

  /**
   * Check if monitoring is active
   */
  isMonitoring(): boolean {
    return this.checkInterval !== null;
  }

  /**
   * Fetch weather data for a specific location
   */
  async fetchWeatherData(latitude: number, longitude: number): Promise<{ temperature: number; humidity: number; uvIndex: number; locationName?: string } | null> {
    try {
      const weatherUrl = `${this.WEATHER_API_BASE}/weather?lat=${latitude}&lon=${longitude}&units=metric&appid=${this.WEATHER_API_KEY}`;
      const weatherResponse = await fetch(weatherUrl);
      
      if (!weatherResponse.ok) {
        console.error('Weather API error:', weatherResponse.status);
        return null;
      }

      const weatherJson = await weatherResponse.json();
      
      // Validate data
      if (!weatherJson.main || typeof weatherJson.main.temp !== 'number') {
        console.error('Invalid weather data received:', weatherJson);
        return null;
      }

      const uvUrl = `${this.WEATHER_API_BASE}/uvi?lat=${latitude}&lon=${longitude}&appid=${this.WEATHER_API_KEY}`;
      const uvResponse = await fetch(uvUrl);
      const uvData = uvResponse.ok ? await uvResponse.json() : { value: 0 };

      return {
        temperature: Math.round(weatherJson.main.temp),
        humidity: Math.round(weatherJson.main.humidity || 0),
        uvIndex: Math.round(uvData.value || 0),
        locationName: weatherJson.name || 'Unknown Location'
      };
    } catch (error) {
      console.error('Error fetching weather data:', error);
      return null;
    }
  }

  /**
   * Stop monitoring climate conditions
   */
  stopMonitoring(): void {
    console.log('🌡️ Stopping climate monitoring');
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }

  /**
   * Check current climate conditions against user thresholds
   */
  private async checkClimateConditions(): Promise<void> {
    try {
      const settings = this.getSettings();
      
      if (!settings.enabled) {
        console.log('🌡️ Climate alerts disabled');
        return;
      }

      if (this.isQuietHours(settings)) {
        console.log('🌡️ Quiet hours active - skipping check');
        return;
      }

      // Check notification cooldown (4 hours minimum between notifications)
      const now = Date.now();
      if (now - this.lastNotificationTime < this.NOTIFICATION_COOLDOWN) {
        const remainingMinutes = Math.ceil((this.NOTIFICATION_COOLDOWN - (now - this.lastNotificationTime)) / 60000);
        console.log(`🌡️ Notification cooldown active - ${remainingMinutes} minutes remaining`);
        return;
      }

      // Get weather data
      const weatherData = await this.getCurrentWeather(settings);
      
      if (!weatherData) {
        console.log('🌡️ Unable to fetch weather data');
        return;
      }

      console.log('🌡️ Current conditions:', weatherData);

      // Check thresholds
      const alerts = this.checkThresholds(weatherData, settings);

      if (alerts.length > 0) {
        this.sendClimateAlert(alerts, weatherData);
        this.lastNotificationTime = now;
      } else {
        console.log('🌡️ Conditions within safe thresholds');
      }
    } catch (error) {
      console.error('🌡️ Error checking climate conditions:', error);
    }
  }

  /**
   * Get current weather data from API
   */
  private async getCurrentWeather(settings: ClimateSettings): Promise<WeatherData | null> {
    try {
      if (!settings.locationEnabled) {
        console.log('🌡️ Location services disabled');
        return null;
      }

      // Get user's location
      const position = await this.getUserLocation();
      
      if (!position) {
        console.log('🌡️ Unable to get user location');
        return null;
      }

      const { latitude, longitude } = position.coords;
      console.log(`🌡️ Location: ${latitude}, ${longitude}`);

      // Fetch current weather
      const weatherUrl = `${this.WEATHER_API_BASE}/weather?lat=${latitude}&lon=${longitude}&units=metric&appid=${this.WEATHER_API_KEY}`;
      const weatherResponse = await fetch(weatherUrl);
      
      if (!weatherResponse.ok) {
        console.error('🌡️ Weather API error:', weatherResponse.status);
        return null;
      }

      const weatherJson = await weatherResponse.json();

      // Fetch UV index
      const uvUrl = `${this.WEATHER_API_BASE}/uvi?lat=${latitude}&lon=${longitude}&appid=${this.WEATHER_API_KEY}`;
      const uvResponse = await fetch(uvUrl);
      const uvJson = await uvResponse.json();

      return {
        temperature: Math.round(weatherJson.main.temp),
        humidity: weatherJson.main.humidity,
        uvIndex: uvJson.value || 0,
        description: weatherJson.weather[0].description,
      };
    } catch (error) {
      console.error('🌡️ Error fetching weather:', error);
      return null;
    }
  }

  /**
   * Get user's geolocation
   */
  private getUserLocation(): Promise<GeolocationPosition | null> {
    return new Promise((resolve) => {
      if (!('geolocation' in navigator)) {
        console.error('🌡️ Geolocation not supported');
        resolve(null);
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => resolve(position),
        (error) => {
          console.error('🌡️ Geolocation error:', error);
          resolve(null);
        },
        { timeout: 10000, enableHighAccuracy: true }
      );
    });
  }

  /**
   * Check if current conditions exceed thresholds
   */
  private checkThresholds(weather: WeatherData, settings: ClimateSettings): string[] {
    const alerts: string[] = [];

    if (weather.temperature >= settings.temperatureThreshold) {
      alerts.push(`Temperature (${weather.temperature}°C)`);
    }

    if (weather.humidity >= settings.humidityThreshold) {
      alerts.push(`Humidity (${weather.humidity}%)`);
    }

    if (weather.uvIndex >= settings.uvThreshold) {
      alerts.push(`UV Index (${weather.uvIndex})`);
    }

    return alerts;
  }

  /**
   * Check if current time is within quiet hours
   */
  private isQuietHours(settings: ClimateSettings): boolean {
    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    
    const { quietHoursStart, quietHoursEnd } = settings;

    // Handle overnight quiet hours (e.g., 22:00 to 07:00)
    if (quietHoursStart > quietHoursEnd) {
      return currentTime >= quietHoursStart || currentTime < quietHoursEnd;
    }
    
    // Regular quiet hours
    return currentTime >= quietHoursStart && currentTime < quietHoursEnd;
  }

  /**
   * Send climate alert notification
   */
  private async sendClimateAlert(alerts: string[], weather: WeatherData): Promise<void> {
    const title = '⚠️ Climate Alert - SweatSmart';
    const body = `High ${alerts.join(', ')} detected. Current conditions may trigger hyperhidrosis episodes. Stay prepared!`;

    console.log('🌡️ Sending climate alert:', { alerts, weather });

    // Request permission if needed
    if ('Notification' in window) {
      if (Notification.permission === 'default') {
        console.log('🌡️ Requesting notification permission...');
        const permission = await Notification.requestPermission();
        console.log('🌡️ Permission result:', permission);
      }

      // Send notification if permitted
      if (Notification.permission === 'granted') {
        try {
          const notification = new Notification(title, {
            body,
            icon: '/icon-192.png',
            badge: '/icon-192.png',
            tag: 'climate-alert',
            requireInteraction: true,
            data: { weather, alerts }
          });
          
          notification.onclick = () => {
            window.focus();
            notification.close();
          };
          
          console.log('🌡️ Notification sent successfully');
        } catch (error) {
          console.error('🌡️ Error sending notification:', error);
        }
      } else {
        console.warn('🌡️ Notification permission not granted:', Notification.permission);
      }
    }

    // Send notification through custom event system as backup
    const event = new CustomEvent('sweatsmart-notification', {
      detail: {
        title,
        body,
        type: 'warning'
      }
    });
    window.dispatchEvent(event);

    // Store notification in localStorage
    this.storeNotification(title, body, weather, alerts);
  }

  /**
   * Store notification for history
   */
  private storeNotification(title: string, body: string, weather: WeatherData, alerts: string[]): void {
    try {
      const notifications = JSON.parse(localStorage.getItem('climate_notifications') || '[]');
      notifications.push({
        title,
        body,
        weather,
        alerts,
        timestamp: new Date().toISOString()
      });
      
      // Keep last 50 notifications
      localStorage.setItem('climate_notifications', JSON.stringify(notifications.slice(-50)));
    } catch (error) {
      console.error('🌡️ Error storing notification:', error);
    }
  }

  /**
   * Get saved climate settings
   */
  private getSettings(): ClimateSettings {
    try {
      const saved = localStorage.getItem('climateSettings');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (error) {
      console.error('🌡️ Error loading settings:', error);
    }

    // Default settings
    return {
      enabled: true,
      temperatureThreshold: 26,
      humidityThreshold: 65,
      uvThreshold: 5,
      quietHoursStart: '22:00',
      quietHoursEnd: '07:00',
      locationEnabled: true,
    };
  }

  /**
   * Manual check for testing
   */
  async checkNow(): Promise<void> {
    console.log('🌡️ Manual climate check triggered');
    await this.checkClimateConditions();
  }

  /**
   * Get notification history
   */
  getNotificationHistory(): any[] {
    try {
      return JSON.parse(localStorage.getItem('climate_notifications') || '[]');
    } catch {
      return [];
    }
  }

  /**
   * Clear notification history
   */
  clearHistory(): void {
    localStorage.removeItem('climate_notifications');
    console.log('🌡️ Notification history cleared');
  }
}

// Export singleton instance
export const climateNotificationService = ClimateNotificationService.getInstance();
