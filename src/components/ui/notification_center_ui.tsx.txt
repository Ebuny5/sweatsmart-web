import React, { useState, useEffect } from 'react';
import { Bell, Settings, X, MapPin, Thermometer, Droplets, Sun, Clock } from 'lucide-react';
import { climateNotificationService } from '@/services/climateNotificationService';

const NotificationCenter = ({ userId }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showPanel, setShowPanel] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [preferences, setPreferences] = useState({
    enabled: true,
    temperatureThreshold: 28,
    humidityThreshold: 70,
    uvThreshold: 6,
    quietHoursStart: '22:00',
    quietHoursEnd: '07:00',
    locationEnabled: true,
  });

  useEffect(() => {
    loadNotifications();
    loadUnreadCount();
    
    // Refresh every minute
    const interval = setInterval(() => {
      loadUnreadCount();
    }, 60000);

    return () => clearInterval(interval);
  }, [userId]);

  const loadNotifications = async () => {
    const data = await climateNotificationService.getNotificationHistory(userId);
    setNotifications(data);
  };

  const loadUnreadCount = async () => {
    const count = await climateNotificationService.getUnreadCount(userId);
    setUnreadCount(count);
  };

  const handleMarkAsRead = async (notificationId) => {
    await climateNotificationService.markAsRead(notificationId);
    loadNotifications();
    loadUnreadCount();
  };

  const handleUpdatePreferences = async () => {
    try {
      await climateNotificationService.updatePreferences(userId, preferences);
      alert('Preferences updated successfully!');
      setShowSettings(false);
    } catch (error) {
      alert('Failed to update preferences');
    }
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const getTriggerIcon = (trigger) => {
    if (trigger.includes('temperature')) return <Thermometer className="w-4 h-4" />;
    if (trigger.includes('humidity')) return <Droplets className="w-4 h-4" />;
    if (trigger.includes('UV')) return <Sun className="w-4 h-4" />;
    return null;
  };

  return (
    <div className="relative">
      {/* Bell Icon Button */}
      <button
        onClick={() => setShowPanel(!showPanel)}
        className="relative p-2 rounded-full hover:bg-gray-100 transition-colors"
      >
        <Bell className="w-6 h-6 text-gray-700" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notification Panel */}
      {showPanel && (
        <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-2xl border border-gray-200 z-50 max-h-[600px] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Climate Alerts</h3>
            <div className="flex gap-2">
              <button
                onClick={() => setShowSettings(!showSettings)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <Settings className="w-5 h-5 text-gray-600" />
              </button>
              <button
                onClick={() => setShowPanel(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>
          </div>

          {/* Settings Panel */}
          {showSettings ? (
            <div className="p-4 overflow-y-auto flex-1">
              <h4 className="font-semibold text-gray-900 mb-4">Notification Settings</h4>
              
              <div className="space-y-4">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={preferences.enabled}
                    onChange={(e) => setPreferences({...preferences, enabled: e.target.checked})}
                    className="w-4 h-4 accent-blue-600"
                  />
                  <span className="text-sm text-gray-700">Enable climate notifications</span>
                </label>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Temperature Alert (°C)
                  </label>
                  <input
                    type="number"
                    value={preferences.temperatureThreshold}
                    onChange={(e) => setPreferences({...preferences, temperatureThreshold: parseInt(e.target.value)})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Humidity Alert (%)
                  </label>
                  <input
                    type="number"
                    value={preferences.humidityThreshold}
                    onChange={(e) => setPreferences({...preferences, humidityThreshold: parseInt(e.target.value)})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    UV Index Alert
                  </label>
                  <input
                    type="number"
                    value={preferences.uvThreshold}
                    onChange={(e) => setPreferences({...preferences, uvThreshold: parseInt(e.target.value)})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Quiet Hours Start
                    </label>
                    <input
                      type="time"
                      value={preferences.quietHoursStart}
                      onChange={(e) => setPreferences({...preferences, quietHoursStart: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Quiet Hours End
                    </label>
                    <input
                      type="time"
                      value={preferences.quietHoursEnd}
                      onChange={(e) => setPreferences({...preferences, quietHoursEnd: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <button
                  onClick={handleUpdatePreferences}
                  className="w-full bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                >
                  Save Preferences
                </button>
              </div>
            </div>
          ) : (
            /* Notifications List */
            <div className="overflow-y-auto flex-1">
              {notifications.length === 0 ? (
                <div className="p-8 text-center">
                  <Bell className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">No climate alerts yet</p>
                  <p className="text-sm text-gray-400 mt-1">We'll notify you when weather conditions trigger alerts</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      onClick={() => handleMarkAsRead(notification.id)}
                      className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                        !notification.read ? 'bg-blue-50' : ''
                      }`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-semibold text-gray-900 text-sm flex-1">
                          {notification.title}
                        </h4>
                        <span className="text-xs text-gray-500 ml-2">
                          {formatTime(notification.created_at)}
                        </span>
                      </div>
                      
                      <p className="text-sm text-gray-700 mb-3">{notification.body}</p>

                      {/* Weather Details */}
                      <div className="flex flex-wrap gap-2 mb-2">
                        <div className="flex items-center gap-1 bg-white px-2 py-1 rounded text-xs">
                          <Thermometer className="w-3 h-3 text-red-500" />
                          <span>{notification.weather_data.temperature}°C</span>
                        </div>
                        <div className="flex items-center gap-1 bg-white px-2 py-1 rounded text-xs">
                          <Droplets className="w-3 h-3 text-blue-500" />
                          <span>{notification.weather_data.humidity}%</span>
                        </div>
                        {notification.weather_data.uvIndex > 0 && (
                          <div className="flex items-center gap-1 bg-white px-2 py-1 rounded text-xs">
                            <Sun className="w-3 h-3 text-yellow-500" />
                            <span>UV {notification.weather_data.uvIndex}</span>
                          </div>
                        )}
                      </div>

                      {/* Triggers */}
                      <div className="flex flex-wrap gap-1">
                        {notification.triggers.map((trigger, idx) => (
                          <span key={idx} className="inline-flex items-center gap-1 bg-orange-100 text-orange-700 px-2 py-1 rounded text-xs">
                            {getTriggerIcon(trigger)}
                            {trigger}
                          </span>
                        ))}
                      </div>

                      {!notification.read && (
                        <div className="mt-2">
                          <span className="inline-block w-2 h-2 bg-blue-600 rounded-full"></span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationCenter;
