import React, { useEffect } from 'react';
import { toast } from '@/components/ui/use-toast';
import { loggingReminderService } from '@/services/LoggingReminderService';
import { enhancedMobileNotificationService } from '@/services/EnhancedMobileNotificationService';

type InAppNotificationDetail = {
  title: string;
  body: string;
  type: 'info' | 'success' | 'warning' | 'destructive';
};

const NotificationListener = () => {
  useEffect(() => {
    // Initialize the logging reminder service (runs globally)
    console.log('🔔 NotificationListener: Initializing global notification services...');

    // Force an initial check for any missed log reminders
    loggingReminderService.forceCheck();

    // Enhanced notification service is already a singleton that initializes on import
    console.log('🔔 NotificationListener: Services initialized');

    return () => {
      // Cleanup on unmount (though this component stays mounted)
      loggingReminderService.cleanup();
      enhancedMobileNotificationService.cleanup();
    };
  }, []);

  // Render in-app toasts for notifications when system notifications are blocked/denied.
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