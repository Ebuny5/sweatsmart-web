import React, { useState, useEffect } from 'react';
import { Cloud, Thermometer, Droplets, Sun, Clock, MapPin, Save, Bell, Info } from 'lucide-react';

const Settings = () => {
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

  useEffect(() => {
    const saved = localStorage.getItem('climateSettings');
    if (saved) {
      setClimateSettings(JSON.parse(saved));
    }
  }, []);

  const handleSave = () => {
    setSaveStatus('Saving...');
    localStorage.setItem('climateSettings', JSON.stringify(climateSettings));
    setTimeout(() => {
      setSaveStatus('✓ Settings saved successfully!');
      setTimeout(() => setSaveStatus(''), 3000);
    }, 500);
  };

  const handleTestNotification = async () => {
    try {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        new Notification('🌡️ Climate Alert - Log Your Episode', {
          body: `High temperature (${climateSettings.temperatureThreshold}°C), humidity (${climateSettings.humidityThreshold}%) detected. Tap to log your sweating episode now.`,
          icon: '/icon-192x192.png',
          badge: '/badge-72x72.png',
          vibrate: [200, 100, 200],
          requireInteraction: true,
        });
        setSaveStatus('✓ Test notification sent!');
        setTimeout(() => setSaveStatus(''), 3000);
      } else {
        setSaveStatus('⚠️ Please allow notifications');
        setTimeout(() => setSaveStatus(''), 3000);
      }
    } catch (error) {
      setSaveStatus('⚠️ Notifications not supported');
      setTimeout(() => setSaveStatus(''), 3000);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 p-4 md:p-6">
      <div className="max-w-3xl mx-auto space-y-6">
        
        <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
          <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
          <p className="text-sm text-gray-600 mt-2">Manage your climate-aware notification preferences</p>
        </div>

        <div className="bg-white rounded-2xl shadow-md p-6 border border-blue-100">
          
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

          {climateSettings.enabled ? (
            <div className="space-y-8">
              
              <div className="p-4 bg-green-50 rounded-xl border-2 border-green-200">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Bell className="w-5 h-5 text-green-600" />
                      <h4 className="font-semibold text-gray-900">Test Notification</h4>
                    </div>
                    <p className="text-xs text-gray-600">
                      See how climate alerts will appear when weather conditions exceed thresholds
                    </p>
                  </div>
                  <button
                    onClick={handleTestNotification}
                    className="px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors shadow-sm"
                  >
                    ▶ Test Now
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                <label className="flex items-center gap-2.5 text-sm font-semibold text-gray-800">
                  <div className="p-2 bg-red-50 rounded-lg">
                    <Thermometer className="w-5 h-5 text-red-500" />
                  </div>
                  Temperature Alert Threshold
                </label>
                <div className="flex items-center gap-4">
                  <input
                    type="range"
                    min="20"
                    max="40"
                    value={climateSettings.temperatureThreshold}
                    onChange={(e) => setClimateSettings({...climateSettings, temperatureThreshold: parseInt(e.target.value)})}
                    className="flex-1 h-3 bg-gradient-to-r from-yellow-200 via-orange-300 to-red-400 rounded-full appearance-none cursor-pointer"
                  />
                  <div className="min-w-[80px] text-center">
                    <div className="font-bold text-2xl text-gray-900 bg-gradient-to-br from-red-50 to-red-100 px-4 py-2.5 rounded-xl border-2 border-red-200 shadow-sm">
                      {climateSettings.temperatureThreshold}°C
                    </div>
                  </div>
                </div>
                <p className="text-xs text-gray-500 pl-2">Alert when temperature exceeds this value</p>
              </div>

              <div className="space-y-3">
                <label className="flex items-center gap-2.5 text-sm font-semibold text-gray-800">
                  <div className="p-2 bg-blue-50 rounded-lg">
                    <Droplets className="w-5 h-5 text-blue-500" />
                  </div>
                  Humidity Alert Threshold
                </label>
                <div className="flex items-center gap-4">
                  <input
                    type="range"
                    min="40"
                    max="100"
                    value={climateSettings.humidityThreshold}
                    onChange={(e) => setClimateSettings({...climateSettings, humidityThreshold: parseInt(e.target.value)})}
                    className="flex-1 h-3 bg-gradient-to-r from-blue-200 to-blue-500 rounded-full appearance-none cursor-pointer"
                  />
                  <div className="min-w-[80px] text-center">
                    <div className="font-bold text-2xl text-gray-900 bg-gradient-to-br from-blue-50 to-blue-100 px-4 py-2.5 rounded-xl border-2 border-blue-200 shadow-sm">
                      {climateSettings.humidityThreshold}%
                    </div>
                  </div>
                </div>
                <p className="text-xs text-gray-500 pl-2">Alert when humidity exceeds this percentage</p>
              </div>

              <div className="space-y-3">
                <label className="flex items-center gap-2.5 text-sm font-semibold text-gray-800">
                  <div className="p-2 bg-yellow-50 rounded-lg">
                    <Sun className="w-5 h-5 text-yellow-500" />
                  </div>
                  UV Index Alert Threshold
                </label>
                <div className="flex items-center gap-4">
                  <input
                    type="range"
                    min="1"
                    max="11"
                    value={climateSettings.uvThreshold}
                    onChange={(e) => setClimateSettings({...climateSettings, uvThreshold: parseInt(e.target.value)})}
                    className="flex-1 h-3 bg-gradient-to-r from-yellow-200 via-orange-400 to-red-500 rounded-full appearance-none cursor-pointer"
                  />
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
                <p className="text-xs text-gray-500 pl-2">No climate alerts during these hours</p>
              </div>

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
                      Required for accurate weather monitoring. Your location is only used for weather data and never shared.
                    </p>
                  </div>
                </label>
              </div>

              <div className="p-5 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border border-gray-200">
                <div className="flex items-center gap-2 mb-3">
                  <Bell className="w-5 h-5 text-gray-700" />
                  <h4 className="text-sm font-bold text-gray-900">How Climate Alerts Work</h4>
                </div>
                <ul className="space-y-2 text-xs text-gray-700">
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 font-bold mt-0.5">•</span>
                    <span>Weather monitored automatically every 30 minutes</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 font-bold mt-0.5">•</span>
                    <span>Alerts sent only when thresholds exceeded</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 font-bold mt-0.5">•</span>
                    <span>Maximum 1 alert per hour</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 font-bold mt-0.5">•</span>
                    <span>Tap notification to log episode with pre-filled weather data</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 font-bold mt-0.5">•</span>
                    <span>Works even when app is closed</span>
                  </li>
                </ul>
              </div>

            </div>
          ) : (
            <div className="text-center py-12">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gray-100 rounded-full mb-4">
                <Cloud className="w-10 h-10 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Climate Alerts Disabled</h3>
              <p className="text-sm text-gray-600 max-w-md mx-auto">
                Enable to receive notifications when weather may trigger sweating episodes
              </p>
            </div>
          )}
        </div>

        <div className="sticky bottom-6 z-10">
          <button
            onClick={handleSave}
            className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-4 rounded-xl font-bold hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-3 text-lg"
          >
            <Save className="w-6 h-6" />
            {saveStatus || 'Save Settings'}
          </button>
          {saveStatus && saveStatus.includes('✓') && (
            <p className="text-center text-sm text-green-600 font-medium mt-2 animate-pulse">
              {saveStatus}
            </p>
          )}
        </div>

      </div>
    </div>
  );
};

export default Settings;

