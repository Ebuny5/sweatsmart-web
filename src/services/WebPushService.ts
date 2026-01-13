/**
 * WebPushService - Handles Web Push subscription and notification management
 * Enables background notifications even when the app is closed
 */

import { supabase } from '@/integrations/supabase/client';

// VAPID public key - this is safe to expose in client code
const VAPID_PUBLIC_KEY = 'BLg3PxY0fWoqQ2kVlxXfTnXFV9JXHDTMqNvVXzQLJqhz7mGnPsH8eY_kZVJQJxFdKhEfQTbNqPmRvXYqVqxQfQE';

class WebPushService {
  private static instance: WebPushService;
  private registration: ServiceWorkerRegistration | null = null;
  private subscription: PushSubscription | null = null;

  private constructor() {}

  static getInstance(): WebPushService {
    if (!WebPushService.instance) {
      WebPushService.instance = new WebPushService();
    }
    return WebPushService.instance;
  }

  /**
   * Check if push notifications are supported
   */
  isSupported(): boolean {
    return 'serviceWorker' in navigator && 
           'PushManager' in window && 
           'Notification' in window;
  }

  /**
   * Get current permission status
   */
  getPermissionStatus(): NotificationPermission {
    if (!('Notification' in window)) {
      return 'denied';
    }
    return Notification.permission;
  }

  /**
   * Request notification permission
   */
  async requestPermission(): Promise<NotificationPermission> {
    if (!('Notification' in window)) {
      console.error('Notifications not supported');
      return 'denied';
    }

    const permission = await Notification.requestPermission();
    console.log('📱 Push permission:', permission);
    return permission;
  }

  /**
   * Initialize the service worker and get push subscription
   */
  async initialize(): Promise<boolean> {
    if (!this.isSupported()) {
      console.warn('Push notifications not supported');
      return false;
    }

    try {
      // Wait for service worker to be ready
      this.registration = await navigator.serviceWorker.ready;
      console.log('📱 Service worker ready for push');

      // Check for existing subscription
      this.subscription = await this.registration.pushManager.getSubscription();
      
      if (this.subscription) {
        console.log('📱 Existing push subscription found');
        return true;
      }

      return true;
    } catch (error) {
      console.error('Failed to initialize push service:', error);
      return false;
    }
  }

  /**
   * Subscribe to push notifications
   */
  async subscribe(
    userId?: string,
    latitude?: number,
    longitude?: number,
    thresholds?: {
      temperature?: number;
      humidity?: number;
      uv?: number;
    }
  ): Promise<PushSubscription | null> {
    if (!this.registration) {
      await this.initialize();
    }

    if (!this.registration) {
      console.error('Service worker not ready');
      return null;
    }

    try {
      // Request permission if needed
      if (Notification.permission === 'default') {
        const permission = await this.requestPermission();
        if (permission !== 'granted') {
          console.log('Push permission denied');
          return null;
        }
      }

      if (Notification.permission !== 'granted') {
        console.log('Push permission not granted');
        return null;
      }

      // Convert VAPID key to Uint8Array
      const applicationServerKey = this.urlBase64ToUint8Array(VAPID_PUBLIC_KEY);

      // Subscribe to push
      this.subscription = await this.registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: applicationServerKey.buffer as ArrayBuffer,
      });

      console.log('📱 Push subscription created:', this.subscription.endpoint);

      // Extract keys from subscription
      const keys = this.subscription.toJSON().keys;
      if (!keys?.p256dh || !keys?.auth) {
        throw new Error('Failed to get subscription keys');
      }

      // Store subscription in database
      const { error } = await supabase
        .from('push_subscriptions')
        .upsert({
          user_id: userId || null,
          endpoint: this.subscription.endpoint,
          p256dh: keys.p256dh,
          auth: keys.auth,
          latitude: latitude || null,
          longitude: longitude || null,
          temperature_threshold: thresholds?.temperature || 24,
          humidity_threshold: thresholds?.humidity || 70,
          uv_threshold: thresholds?.uv || 6,
          is_active: true,
        }, {
          onConflict: 'endpoint',
        });

      if (error) {
        console.error('Failed to store subscription:', error);
        throw error;
      }

      console.log('📱 Push subscription stored in database');
      return this.subscription;
    } catch (error) {
      console.error('Failed to subscribe to push:', error);
      return null;
    }
  }

  /**
   * Unsubscribe from push notifications
   */
  async unsubscribe(): Promise<boolean> {
    if (!this.subscription) {
      return true;
    }

    try {
      // Remove from database
      await supabase
        .from('push_subscriptions')
        .delete()
        .eq('endpoint', this.subscription.endpoint);

      // Unsubscribe from push
      await this.subscription.unsubscribe();
      this.subscription = null;

      console.log('📱 Push subscription removed');
      return true;
    } catch (error) {
      console.error('Failed to unsubscribe:', error);
      return false;
    }
  }

  /**
   * Update subscription settings
   */
  async updateSettings(settings: {
    latitude?: number;
    longitude?: number;
    temperature_threshold?: number;
    humidity_threshold?: number;
    uv_threshold?: number;
    is_active?: boolean;
  }): Promise<boolean> {
    if (!this.subscription) {
      console.warn('No active subscription to update');
      return false;
    }

    try {
      const { error } = await supabase
        .from('push_subscriptions')
        .update(settings)
        .eq('endpoint', this.subscription.endpoint);

      if (error) {
        console.error('Failed to update subscription:', error);
        return false;
      }

      console.log('📱 Push subscription settings updated');
      return true;
    } catch (error) {
      console.error('Failed to update settings:', error);
      return false;
    }
  }

  /**
   * Check if currently subscribed
   */
  async isSubscribed(): Promise<boolean> {
    if (!this.registration) {
      await this.initialize();
    }

    if (!this.registration) {
      return false;
    }

    this.subscription = await this.registration.pushManager.getSubscription();
    return this.subscription !== null;
  }

  /**
   * Get current subscription
   */
  async getSubscription(): Promise<PushSubscription | null> {
    if (!this.registration) {
      await this.initialize();
    }

    if (!this.registration) {
      return null;
    }

    this.subscription = await this.registration.pushManager.getSubscription();
    return this.subscription;
  }

  /**
   * Send a test notification through the edge function
   */
  async sendTestNotification(): Promise<boolean> {
    if (!this.subscription) {
      console.warn('No active subscription');
      return false;
    }

    try {
      const { data, error } = await supabase.functions.invoke('send-push-notification', {
        body: {
          action: 'send_to_endpoint',
          endpoint: this.subscription.endpoint,
          notification: {
            title: '✅ Test Notification',
            body: 'Web Push is working! You\'ll receive climate alerts even when the app is closed.',
            tag: 'test-push',
            type: 'info',
            url: '/climate',
          },
        },
      });

      if (error) {
        console.error('Test notification failed:', error);
        return false;
      }

      console.log('📱 Test notification sent:', data);
      return data?.success || false;
    } catch (error) {
      console.error('Failed to send test notification:', error);
      return false;
    }
  }

  /**
   * Convert VAPID key from base64 URL to Uint8Array
   */
  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }

    return outputArray;
  }
}

// Export singleton instance
export const webPushService = WebPushService.getInstance();
