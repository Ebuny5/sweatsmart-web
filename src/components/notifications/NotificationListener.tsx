import { useEffect } from 'react';
import { toast } from '@/components/ui/use-toast';
import { loggingReminderService } from '@/services/LoggingReminderService';
import { notificationManager } from '@/services/NotificationManager';
import { climateAlertService } from '@/services/ClimateAlertService';

type InAppNotificationDetail = {
  title: string;
  body: string;
  type: 'info' | 'success' | 'warning' | 'destructive';
};

const NotificationListener = () => {
  useEffect(() => {
    // Initialize the unified notification and reminder services
    console.log('🔔 NotificationListener: Initializing global notification services...');

    // Accessing notificationManager.getInstance() ensures listeners are attached
    notificationManager;

    // Initialize background services
    loggingReminderService.forceCheck();
    climateAlertService.initialize();

    return () => {
      loggingReminderService.cleanup();
      climateAlertService.cleanup();
    };
  }, []);

  // Render in-app toasts for notifications
  useEffect(() => {
    const handleInAppNotification = (event: Event) => {
      const detail = (event as CustomEvent<InAppNotificationDetail>).detail;
      if (!detail?.title) return;

      toast({
        title: detail.title,
        description: detail.body,
        variant: detail.type === 'destructive' ? 'destructive' : 'default',
      });
    };

    window.addEventListener('sweatsmart-notification', handleInAppNotification as EventListener);
    return () => {
      window.removeEventListener('sweatsmart-notification', handleInAppNotification as EventListener);
    };
  }, []);

  return null;
};

export default NotificationListener;
