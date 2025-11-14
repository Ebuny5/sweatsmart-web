import React from 'react';

interface NotificationCenterProps {
  userId: string;
}

const NotificationCenter: React.FC<NotificationCenterProps> = ({ userId }) => {
  return (
    <div className="notification-center">
      {/* Notification center implementation */}
    </div>
  );
};

export default NotificationCenter;
