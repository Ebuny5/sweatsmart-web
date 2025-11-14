// Climate notification service
export interface ClimateNotification {
  id: string;
  type: 'warning' | 'alert' | 'info';
  message: string;
  timestamp: Date;
}

export const getClimateNotifications = async (userId: string): Promise<ClimateNotification[]> => {
  // Placeholder implementation
  return [];
};

export const markNotificationAsRead = async (notificationId: string): Promise<void> => {
  // Placeholder implementation
  console.log('Marking notification as read:', notificationId);
};

export const climateNotificationService = {
  getClimateNotifications,
  markNotificationAsRead,
};
