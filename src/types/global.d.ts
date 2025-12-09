declare global {
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
