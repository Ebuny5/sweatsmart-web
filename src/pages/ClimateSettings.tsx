import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Bell, MapPin, Info, Save, CloudSun } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { toast } from 'sonner';
import { climateNotificationService } from '@/services/ClimateNotificationService';
import { useSettings } from '@/hooks/useSettings';

export default function ClimateSettings() {
  const navigate = useNavigate();
  const { settings, updateSettings } = useSettings();
  
  const [climateEnabled, setClimateEnabled] = useState(false);
  const [episodeReminders, setEpisodeReminders] = useState(true);
  const [sensitivity, setSensitivity] = useState<'high' | 'standard' | 'low'>('standard');
  const [temperatureThreshold, setTemperatureThreshold] = useState(24);
  const [humidityThreshold, setHumidityThreshold] = useState(70);
  const [uvThreshold, setUvThreshold] = useState(6);
  const [quietHoursStart, setQuietHoursStart] = useState('22:00');
  const [quietHoursEnd, setQuietHoursEnd] = useState('07:00');
  const [locationEnabled, setLocationEnabled] = useState(false);
  const [currentLocation, setCurrentLocation] = useState('');
  const [notificationPermission, setNotificationPermission] = useState<'granted' | 'denied' | 'default'>('default');

  useEffect(() => {
    checkLocationPermission();
    checkNotificationPermission();
    loadSavedSettings();
  }, []);

  const checkNotificationPermission = () => {
    if ('Notification' in window) {
      setNotificationPermission(Notification.permission);
    }
  };

  const requestNotificationPermission = async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      setNotificationPermission(permission);
      
      if (permission === 'granted') {
        toast.success('Notifications enabled!');
        // Send test notification
        new Notification('🌡️ Climate Monitoring Active', {
          body: 'You\'ll now receive alerts when conditions may trigger episodes',
          icon: '/icon-192.png',
          badge: '/icon-192.png',
        });
      } else if (permission === 'denied') {
        toast.error('Notifications blocked. Please enable in browser settings.');
      }
    }
  };

  const checkLocationPermission = async () => {
    try {
      const position = await getCurrentPosition();
      setLocationEnabled(true);
      reverseGeocode(position.coords.latitude, position.coords.longitude);
    } catch {
      setLocationEnabled(false);
    }
  };

  const getCurrentPosition = (): Promise<GeolocationPosition> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation not supported'));
        return;
      }
      navigator.geolocation.getCurrentPosition(resolve, reject);
    });
  };

  const reverseGeocode = async (lat: number, lon: number) => {
    try {
      const response = await fetch(
        `https://api.openweathermap.org/geo/1.0/reverse?lat=${lat}&lon=${lon}&limit=1&appid=da885c59976d67ec00d9e44a3b3f15f5`
      );
      const data = await response.json();
      if (data && data.length > 0) {
        setCurrentLocation(`${data[0].name}, ${data[0].country}`);
      }
    } catch (error) {
      console.error('Geocoding error:', error);
      setCurrentLocation(`${lat.toFixed(4)}, ${lon.toFixed(4)}`);
    }
  };

  const loadSavedSettings = () => {
    // Load from localStorage or settings
    const saved = localStorage.getItem('climateSettings');
    if (saved) {
      const parsed = JSON.parse(saved);
      setClimateEnabled(parsed.enabled || false);
      setSensitivity(parsed.sensitivity || 'standard');
      setTemperatureThreshold(parsed.temperatureThreshold || 24);
      setHumidityThreshold(parsed.humidityThreshold || 70);
      setUvThreshold(parsed.uvThreshold || 6);
      setQuietHoursStart(parsed.quietHoursStart || '22:00');
      setQuietHoursEnd(parsed.quietHoursEnd || '07:00');
    }
    setEpisodeReminders(settings?.daily_reminders ?? true);
  };

  const handleSaveSettings = async () => {
    // Check notification permission first
    if (climateEnabled && notificationPermission !== 'granted') {
      await requestNotificationPermission();
      return;
    }

    const climateSettings = {
      enabled: climateEnabled,
      sensitivity,
      temperatureThreshold,
      humidityThreshold,
      uvThreshold,
      quietHoursStart,
      quietHoursEnd,
      locationEnabled
    };

    localStorage.setItem('climateSettings', JSON.stringify(climateSettings));

    if (updateSettings) {
      await updateSettings({ daily_reminders: episodeReminders });
    }

    // Start/stop monitoring based on settings
    if (climateEnabled && locationEnabled && notificationPermission === 'granted') {
      if (!climateNotificationService.isMonitoring()) {
        climateNotificationService.startMonitoring({
          enabled: true,
          temperatureThreshold,
          humidityThreshold,
          uvThreshold,
          quietHoursStart,
          quietHoursEnd,
          locationEnabled: true
        });
      }
    } else {
      climateNotificationService.stopMonitoring();
    }

    toast.success('Settings saved successfully!');
  };

  const handleLocationToggle = async (enabled: boolean) => {
    if (enabled) {
      try {
        await getCurrentPosition();
        setLocationEnabled(true);
        toast.success('Location access granted');
      } catch {
        toast.error('Location access denied');
        setLocationEnabled(false);
      }
    } else {
      setLocationEnabled(false);
      climateNotificationService.stopMonitoring();
    }
  };

  const getSensitivityInfo = (level: 'high' | 'standard' | 'low') => {
    const info = {
      high: {
        title: 'High Sensitivity',
        threshold: "Alerts at 27°C+ Heat Index (Caution level)",
        description: 'Best for severe hyperhidrosis or high sensitivity'
      },
      standard: {
        title: 'Standard Sensitivity',
        threshold: "Alerts at 32°C+ Heat Index (Extreme Caution level)",
        description: 'Default setting for most hyperhidrosis warriors'
      },
      low: {
        title: 'Low Sensitivity',
        threshold: "Alerts at 36°C+ Heat Index (Danger level)",
        description: 'For milder hyperhidrosis or hot climates'
      }
    };
    return info[level];
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      {/* Header */}
      <header className="bg-card border-b sticky top-0 z-10 shadow-sm">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Climate Aware Notifications</h1>
            <p className="text-sm text-muted-foreground">Smart weather monitoring for episode prevention</p>
          </div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto p-4 space-y-4 pb-24">
        {/* Notification Permission Alert */}
        {climateEnabled && notificationPermission !== 'granted' && (
          <Card className="p-4 bg-amber-50 border-amber-200">
            <div className="flex items-start gap-3">
              <Bell className="w-5 h-5 text-amber-600 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-semibold text-amber-900 mb-1">
                  Notifications Required
                </h3>
                <p className="text-sm text-amber-800 mb-3">
                  Climate monitoring needs notification permission to alert you about triggering conditions.
                </p>
                <Button 
                  onClick={requestNotificationPermission}
                  className="bg-amber-600 hover:bg-amber-700"
                >
                  Enable Notifications
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* Climate Monitoring */}
        <Card className="p-6">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-primary/10 rounded-lg">
              <Bell className="w-6 h-6 text-primary" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-xl font-bold">Climate Monitoring</h2>
                <Switch
                  checked={climateEnabled}
                  onCheckedChange={setClimateEnabled}
                />
              </div>
              <p className="text-sm text-muted-foreground mb-1">
                Automatically monitor conditions that may trigger hyperhidrosis episodes
              </p>
              <p className="text-xs text-muted-foreground">
                Checks every 30 minutes • 4-hour cooldown between alerts
              </p>
            </div>
          </div>
        </Card>

        {/* Episode Tracking */}
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-green-500/10 rounded-lg">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <h2 className="text-xl font-bold">Episode Tracking</h2>
          </div>
          
          <p className="text-sm text-muted-foreground mb-6">
            Regular episode logging helps you track patterns, identify triggers, and better manage your hyperhidrosis.
          </p>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">4-Hour Reminders</div>
                <div className="text-sm text-muted-foreground">Get notifications to log your episodes</div>
              </div>
              <Switch
                checked={episodeReminders}
                onCheckedChange={setEpisodeReminders}
              />
            </div>

            <Button
              className="w-full bg-green-50 hover:bg-green-100 text-green-700 border border-green-200"
              onClick={() => navigate('/log-episode')}
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Mark Episode as Logged
            </Button>
          </div>
        </Card>

        {/* Alert Sensitivity */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-500/10 rounded-lg">
                <CloudSun className="w-6 h-6 text-amber-600" />
              </div>
              <h2 className="text-xl font-bold">Alert Sensitivity</h2>
            </div>
            <Info className="w-5 h-5 text-muted-foreground" />
          </div>

          <div className="space-y-4">
            {(['high', 'standard', 'low'] as const).map((level) => {
              const info = getSensitivityInfo(level);
              const isSelected = sensitivity === level;
              
              return (
                <div
                  key={level}
                  onClick={() => setSensitivity(level)}
                  className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                    isSelected
                      ? 'border-amber-500 bg-amber-50'
                      : 'border-border hover:border-amber-200'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="font-semibold mb-1">{info.title}</div>
                      <div className="text-sm text-muted-foreground mb-1">{info.threshold}</div>
                      <div className="text-xs italic text-muted-foreground">{info.description}</div>
                    </div>
                    {isSelected && (
                      <div className="w-6 h-6 rounded-full bg-amber-500 flex items-center justify-center">
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Location & Data */}
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-green-500/10 rounded-lg">
              <MapPin className="w-6 h-6 text-green-600" />
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold">Location & Data</h2>
            </div>
            <Info className="w-5 h-5 text-muted-foreground" />
          </div>

          {currentLocation && (
            <div className="mb-4">
              <div className="text-sm text-muted-foreground mb-1">Current Location: {currentLocation}</div>
              <div className="text-xs text-muted-foreground">Weather data updates automatically</div>
            </div>
          )}

          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                checked={locationEnabled}
                onChange={(e) => handleLocationToggle(e.target.checked)}
                className="mt-1"
              />
              <div className="flex-1">
                <div className="font-medium mb-1">Use Current Location</div>
                <div className="text-sm text-muted-foreground">
                  Required for accurate weather monitoring. Your location is only used for weather data and never shared.
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* How It Works */}
        <Card className="p-6">
          <h2 className="text-xl font-bold mb-4">How It Works</h2>
          
          <p className="text-sm text-muted-foreground mb-4">
            Climate Aware Notifications monitors real-time weather conditions and alerts you when conditions may trigger hyperhidrosis episodes.
          </p>

          <div className="space-y-3">
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="font-medium text-blue-900 mb-1">
                ✓ Real-time monitoring every 30 minutes
              </div>
            </div>

            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="font-medium text-green-900 mb-1">
                ✓ Smart cooldown prevents alert fatigue (4 hours between notifications)
              </div>
            </div>

            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <div className="font-medium text-amber-900 mb-1">
                ✓ Respects quiet hours - no alerts during sleep
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Save Button - Fixed at bottom */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-background border-t">
        <div className="max-w-2xl mx-auto">
          <Button
            onClick={handleSaveSettings}
            className="w-full py-6 text-lg font-semibold"
            size="lg"
          >
            <Save className="mr-2 h-5 w-5" />
            Save Settings
          </Button>
        </div>
      </div>
    </div>
  );
}
