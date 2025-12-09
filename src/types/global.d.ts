
declare global {
  interface Window {
    notificationTimeout?: NodeJS.Timeout;
    notificationInterval?: NodeJS.Timeout;
  }
}

export {};
