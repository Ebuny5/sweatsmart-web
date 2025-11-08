
import { useEffect, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';

const FOUR_HOURS = 4 * 60 * 60 * 1000;
const LAST_SENT_KEY = 'sweatsmart_four_hour_last';
const FOUR_HOUR_ENABLED_KEY = 'sweatsmart_four_hour_enabled';

const NotificationListener = () => {
  const { toast } = useToast();
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    const handleNotification = (event: CustomEvent) => {
      const { title, body, type } = event.detail;
      console.log('🔔 NotificationListener: Received notification:', { title, body, type });
      toast({
        title,
        description: body,
        variant: type === 'destructive' ? 'destructive' : 'default',
        duration: type === 'destructive' ? 8000 : 5000,
      });
    };

    console.log('🔔 NotificationListener: Setting up event listener');
    // @ts-ignore
    window.addEventListener('sweatsmart-notification', handleNotification);

    // Ensure compulsory 4-hour general alert is active
    const ensureFourHourAlert = async () => {
      try {
        localStorage.setItem(FOUR_HOUR_ENABLED_KEY, 'true'); // compulsory
        if ('Notification' in window && Notification.permission === 'default') {
          await Notification.requestPermission().catch(() => {});
        }

        const sendFourHourAlert = () => {
          const title = 'SweatSmart Check‑in';
          const body = 'Time to review symptoms and log episodes (every 4 hours).';

          if ('Notification' in window && Notification.permission === 'granted') {
            try {
              const n = new Notification(title, {
                body,
                icon: '/favicon.ico',
                badge: '/favicon.ico',
                requireInteraction: true,
                tag: 'sweatsmart-4h'
              });
              n.onclick = () => { window.focus(); n.close(); };
            } catch (e) {
              console.warn('Browser notification failed, falling back to in-app toast', e);
              window.dispatchEvent(new CustomEvent('sweatsmart-notification', { detail: { title, body, type: 'info' } }));
            }
          } else {
            window.dispatchEvent(new CustomEvent('sweatsmart-notification', { detail: { title, body, type: 'info' } }));
          }
          localStorage.setItem(LAST_SENT_KEY, Date.now().toString());
        };

        const checkAndNotify = () => {
          const last = parseInt(localStorage.getItem(LAST_SENT_KEY) || '0', 10);
          const now = Date.now();
          if (!last || now - last >= FOUR_HOURS) {
            sendFourHourAlert();
          }
        };

        // Initial check on app load and every minute thereafter
        checkAndNotify();
        if (intervalRef.current) window.clearInterval(intervalRef.current);
        intervalRef.current = window.setInterval(checkAndNotify, 60 * 1000);

        // Also recheck when window gains focus
        window.addEventListener('focus', checkAndNotify);
        return () => window.removeEventListener('focus', checkAndNotify);
      } catch (e) {
        console.error('Failed to initialize 4-hour compulsory alert', e);
      }
    };

    const cleanupFocus = ensureFourHourAlert();

    return () => {
      console.log('🔔 NotificationListener: Cleaning up event listener');
      // @ts-ignore
      window.removeEventListener('sweatsmart-notification', handleNotification);
      if (intervalRef.current) window.clearInterval(intervalRef.current);
      // cleanup focus listener if returned
      // @ts-ignore
      if (typeof cleanupFocus === 'function') cleanupFocus();
    };
  }, [toast]);

  return null;
};

export default NotificationListener;
