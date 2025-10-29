import React, { useState, useEffect } from 'react';
import { Cloud, Thermometer, Droplets, Sun, Clock, MapPin, Save, Bell, Info } from 'lucide-react';

const ProfessionalSettings = ({ userId }) => {
  const [climateSettings, setClimateSettings] = useState({
    enabled: true,
    temperatureThreshold: 28,
    humidityThreshold: 70,
    uvThreshold: 6,
    quietHoursStart: '22:00',
    quietHoursEnd: '07:00',
    locationEnabled: true,
  });

  const [saveStatus, setSaveStatus] = useState('');

  // Load user preferences on mount
  useEffect(() => {
    if (userId) {
      loadPreferences();
    }
  }, [userId]);

  const loadPreferences = async () => {
    try {
      const prefs = await climateNotificationService.getUserPreferences(userId);
      if (prefs) {
        setClimateSettings({
          enabled: prefs.enabled,
          temperatureThreshold: prefs.temperatureThreshold,
          humidityThreshold: prefs.humidityThreshold,
          uvThreshold: prefs.uvThreshold,
          quietHoursStart: prefs.quietHoursStart,
          quietHoursEnd: prefs.quietHoursEnd,
          locationEnabled: prefs.locationEnabled,
        });
      }
    } catch (error) {
      console.error('Error loading preferences:', error);
    }
  };

  const handleSave = async () => {
    setSaveStatus('Saving...');
    try {
      // Save to Supabase via climateNotificationService
      await climateNotificationService.updatePreferences(userId, climateSettings);
      setSaveStatus('âœ“ Settings saved successfully');
      setTimeout(() => setSaveStatus(''), 3000);
    } catch (error) {
      setSaveStatus('âŒ Failed to save. Please try again.');
      setTimeout(() => setSaveStatus(''), 3000);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 p-4 md:p-6">
      <div className="max-w-3xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
          <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
          <p className="text-sm text-gray-600 mt-2">Manage your climate-aware notification preferences</p>
        </div>

        {/* Climate-Aware Notifications - Main Feature */}
        <div className="bg-white rounded-2xl shadow-md p-6 border border-blue-100">
          
          {/* Header with Toggle */}
          <div className="flex items-center justify-between mb-6 pb-6 border-b border-gray-100">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl">
                <Cloud className="w-7 h-7 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-2xl font-bold text-gray-900">Climate-Aware Alerts</h2>
                  <span className="px-2.5 py-0.5 bg-gradient-to-r from-green-400 to-green-500 text-white text-xs font-bold rounded-full">
                    SMART
                  </span>
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  Intelligent weather monitoring for proactive episode management
                </p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={climateSettings.enabled}
                onChange={(e) => setClimateSettings({...climateSettings, enabled: e.target.checked})}
                className="sr-only peer"
              />
              <div className="w-16 h-8 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-8 peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-7 after:w-7 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-blue-500 peer-checked:to-blue-600 shadow-inner"></div>
            </label>
          </div>

          {/* Settings Content */}
          {climateSettings.enabled ? (
            <div className="space-y-8">
              
              {/* Temperature Threshold */}
              <div className="space-y-3">
                <label className="flex items-center gap-2.5 text-sm font-semibold text-gray-800">
                  <div className="p-2 bg-red-50 rounded-lg">
                    <Thermometer className="w-5 h-5 text-red-500" />
                  </div>
                  Temperature Alert Threshold
                </label>
                <div className="flex items-center gap-4">
                  <div className="flex-1 relative">
                    <input
                      type="range"
                      min="20"
                      max="40"
                      value={climateSettings.temperatureThreshold}
                      onChange={(e) => setClimateSettings({...climateSettings, temperatureThreshold: parseInt(e.target.value)})}
                      className="w-full h-3 bg-gradient-to-r from-yellow-200 via-orange-300 to-red-400 rounded-full appearance-none cursor-pointer"
                      style={{
                        background: `linear-gradient(to right, #fef08a 0%, #fdba74 50%, #f87171 100%)`
                      }}
                    />
                  </div>
                  <div className="min-w-[80px] text-center">
                    <div className="font-bold text-2xl text-gray-900 bg-gradient-to-br from-red-50 to-red-100 px-4 py-2.5 rounded-xl border-2 border-red-200 shadow-sm">
                      {climateSettings.temperatureThreshold}Â°C
                    </div>
                  </div>
                </div>
                <p className="text-xs text-gray-500 pl-2">Alert when temperature exceeds this value</p>
              </div>

              {/* Humidity Threshold */}
              <div className="space-y-3">
                <label className="flex items-center gap-2.5 text-sm font-semibold text-gray-800">
                  <div className="p-2 bg-blue-50 rounded-lg">
                    <Droplets className="w-5 h-5 text-blue-500" />
                  </div>
                  Humidity Alert Threshold
                </label>
                <div className="flex items-center gap-4">
                  <div className="flex-1 relative">
                    <input
                      type="range"
                      min="40"
                      max="100"
                      value={climateSettings.humidityThreshold}
                      onChange={(e) => setClimateSettings({...climateSettings, humidityThreshold: parseInt(e.target.value)})}
                      className="w-full h-3 bg-gradient-to-r from-blue-200 to-blue-500 rounded-full appearance-none cursor-pointer"
                    />
                  </div>
                  <div className="min-w-[80px] text-center">
                    <div className="font-bold text-2xl text-gray-900 bg-gradient-to-br from-blue-50 to-blue-100 px-4 py-2.5 rounded-xl border-2 border-blue-200 shadow-sm">
                      {climateSettings.humidityThreshold}%
                    </div>
                  </div>
                </div>
                <p className="text-xs text-gray-500 pl-2">Alert when humidity exceeds this percentage</p>
              </div>

              {/* UV Index Threshold */}
              <div className="space-y-3">
                <label className="flex items-center gap-2.5 text-sm font-semibold text-gray-800">
                  <div className="p-2 bg-yellow-50 rounded-lg">
                    <Sun className="w-5 h-5 text-yellow-500" />
                  </div>
                  UV Index Alert Threshold
                </label>
                <div className="flex items-center gap-4">
                  <div className="flex-1 relative">
                    <input
                      type="range"
                      min="1"
                      max="11"
                      value={climateSettings.uvThreshold}
                      onChange={(e) => setClimateSettings({...climateSettings, uvThreshold: parseInt(e.target.value)})}
                      className="w-full h-3 bg-gradient-to-r from-yellow-200 via-orange-400 to-red-500 rounded-full appearance-none cursor-pointer"
                    />
                  </div>
                  <div className="min-w-[80px] text-center">
                    <div className="font-bold text-2xl text-gray-900 bg-gradient-to-br from-yellow-50 to-yellow-100 px-4 py-2.5 rounded-xl border-2 border-yellow-200 shadow-sm">
                      {climateSettings.uvThreshold}
                    </div>
                  </div>
                </div>
                <div className="flex items-start gap-2 pl-2">
                  <Info className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-gray-500">
                    6-7: High | 8-10: Very High | 11+: Extreme
                  </p>
                </div>
              </div>

              {/* Quiet Hours */}
              <div className="pt-6 border-t border-gray-100 space-y-3">
                <label className="flex items-center gap-2.5 text-sm font-semibold text-gray-800">
                  <div className="p-2 bg-purple-50 rounded-lg">
                    <Clock className="w-5 h-5 text-purple-500" />
                  </div>
                  Quiet Hours (Do Not Disturb)
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-gray-600 mb-2 block font-medium">Start Time</label>
                    <input
                      type="time"
                      value={climateSettings.quietHoursStart}
                      onChange={(e) => setClimateSettings({...climateSettings, quietHoursStart: e.target.value})}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all font-medium"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-600 mb-2 block font-medium">End Time</label>
                    <input
                      type="time"
                      value={climateSettings.quietHoursEnd}
                      onChange={(e) => setClimateSettings({...climateSettings, quietHoursEnd: e.target.value})}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all font-medium"
                    />
                  </div>
                </div>
                <p className="text-xs text-gray-500 pl-2">No climate alerts will be sent during these hours</p>
              </div>

              {/* Location Permission */}
              <div className="p-5 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border-2 border-blue-200">
                <label className="flex items-start gap-4 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={climateSettings.locationEnabled}
                    onChange={(e) => setClimateSettings({...climateSettings, locationEnabled: e.target.checked})}
                    className="mt-1 w-5 h-5 accent-blue-600 rounded"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <MapPin className="w-5 h-5 text-blue-600" />
                      <span className="font-semibold text-gray-900">Use Current Location</span>
                    </div>
                    <p className="text-xs text-gray-700 leading-relaxed">
                      Required for accurate weather monitoring in your area. Your location is only used for weather data and never shared with third parties.
                    </p>
                  </div>
                </label>
              </div>

              {/* How It Works Info */}
              <div className="p-5 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border border-gray-200">
                <div className="flex items-center gap-2 mb-3">
                  <Bell className="w-5 h-5 text-gray-700" />
                  <h4 className="text-sm font-bold text-gray-900">How Climate Alerts Work</h4>
                </div>
                <ul className="space-y-2 text-xs text-gray-700">
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 font-bold mt-0.5">â€¢</span>
                    <span>Weather conditions monitored automatically every 30 minutes</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 font-bold mt-0.5">â€¢</span>
                    <span>Alerts sent only when thresholds are exceeded</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 font-bold mt-0.5">â€¢</span>
                    <span>Maximum 1 alert per hour to prevent spam</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 font-bold mt-0.5">â€¢</span>
                    <span>Tap notification to instantly log your episode with weather data pre-filled</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 font-bold mt-0.5">â€¢</span>
                    <span>Works even when app is closed (requires notification permission)</span>
                  </li>
                </ul>
              </div>

            </div>
          ) : (
            /* Disabled State */
            <div className="text-center py-12">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gray-100 rounded-full mb-4">
                <Cloud className="w-10 h-10 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Climate Alerts Disabled</h3>
              <p className="text-sm text-gray-600 max-w-md mx-auto">
                Enable climate-aware alerts to receive notifications when weather conditions may trigger sweating episodes
              </p>
            </div>
          )}
        </div>

        {/* Data Management */}
        <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Data Management</h2>
          <p className="text-sm text-gray-600 mb-4">Export or manage your episode data</p>
          
          <div className="flex flex-wrap gap-3">
            <button className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium shadow-sm hover:shadow-md">
              ðŸ“Š Export as CSV
            </button>
            <button className="px-6 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors font-medium shadow-sm hover:shadow-md">
              ðŸ—‘ï¸ Clear All Data
            </button>
          </div>
        </div>

        {/* Save Button - Sticky */}
        <div className="sticky bottom-6 z-10">
          <button
            onClick={handleSave}
            disabled={saveStatus === 'Saving...'}
            className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-4 rounded-xl font-bold hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed text-lg"
          >
            <Save className="w-6 h-6" />
            {saveStatus || 'Save Settings'}
          </button>
          {saveStatus && saveStatus.includes('âœ“') && (
            <p className="text-center text-sm text-green-600 font-medium mt-2">
              {saveStatus}
            </p>
          )}
        </div>

      </div>
    </div>
  );
};

export default ProfessionalSettings;
