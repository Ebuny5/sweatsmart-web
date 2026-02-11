declare global {
  interface PushManager {
    getSubscription(): Promise<PushSubscription | null>;
    subscribe(options?: PushSubscriptionOptionsInit): Promise<PushSubscription>;
    permissionState(options?: PushSubscriptionOptionsInit): Promise<PermissionState>;
  }

  interface ServiceWorkerRegistration {
    readonly pushManager: PushManager;
  }

  interface Window {
    notificationTimeout?: NodeJS.Timeout;
    notificationInterval?: NodeJS.Timeout;
    median?: {
      notification?: {
        show: (options: { title: string; body: string; badge?: string }) => void;
      };
    };
    Capacitor?: {
      Plugins?: {
        LocalNotifications?: {
          schedule: (options: { notifications: Array<{ title: string; body: string; id: number; schedule: { at: Date } }> }) => void;
        };
      };
    };
  }
}

export {};
