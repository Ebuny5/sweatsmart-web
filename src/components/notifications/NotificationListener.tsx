import React, { useEffect } from 'react';
import { loggingReminderService } from '@/services/LoggingReminderService';
import { enhancedMobileNotificationService } from '@/services/EnhancedMobileNotificationService';

const NotificationListener = () => {
  useEffect(() => {
    // Initialize the logging reminder service (runs globally)
    console.log('🔔 NotificationListener: Initializing global notification services...');
    
    // Force an initial check for any missed log reminders
    loggingReminderService.forceCheck();
    
    // Enhanced notification service is already a singleton that initializes on import
    // but we can log that it's ready
    console.log('🔔 NotificationListener: Services initialized');

    return () => {
      // Cleanup on unmount (though this component stays mounted)
      loggingReminderService.cleanup();
      enhancedMobileNotificationService.cleanup();
    };
  }, []);

  return null;
};

export default NotificationListener;