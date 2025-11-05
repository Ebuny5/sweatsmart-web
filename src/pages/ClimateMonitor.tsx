import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, RefreshCw, Settings, Clock, Thermometer, Droplets, Sun } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { climateNotificationService } from '@/services/ClimateNotificationService';

interface WeatherData {
  temperature: number;
  humidity: number;
  uvIndex: number;
  location: string;
  lastUpdated: string;
}

interface AlertSettings {
  temperatureThreshold: number;
  humidityThreshold: number;
  uvThreshold: number;
  sensitivity: 'high' | 'standard' | 'low';
}

export default function ClimateMonitor() {
  const navigate = useNavigate();
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [loading, setLoading] = useState(false);
  const [alertSettings, setAlertSettings] = useState<AlertSettings>({
    temperatureThreshold: 24,
    humidityThreshold: 70,
    uvThreshold: 6,
    sensitivity: 'standard'
  });

  useEffect(() => {
    checkMonitoringStatus();
    fetchCurrentWeather();
  }, []);

  const checkMonitoringStatus = () => {
    const monitoring = climateNotificationService.isMonitoring();
    setIsMonitoring(monitoring);
  };

  const fetchCurrentWeather = async () => {
    setLoading(true);
    try {
      const position = await getCurrentPosition();
      const data = await climateNotificationService.fetchWeatherData(
        position.coords.latitude,
        position.coords.longitude
      );
      
      if (data) {
        setWeather({
          temperature: data.temperature,
          humidity: data.humidity,
          uvIndex: data.uvIndex,
          location: data.locationName || 'Current Location',
          lastUpdated: new Date().toLocaleTimeString('en-US', { 
            hour: 'numeric', 
            minute: '2-digit',
            hour12: true 
          })
        });
      }
    } catch (error) {
      console.error('Error fetching weather:', error);
      toast.error('Unable to fetch weather data');
    } finally {
      setLoading(false);
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

  const handleTestNotification = async () => {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      new Notification('SweatSmart Test Alert', {
        body: 'Your climate notifications are working perfectly!',
        icon: '/icon-192.png',
        badge: '/icon-192.png'
      });
      toast.success('Test notification sent!');
    } else {
      toast.error('Notification permission denied');
    }
  };

  const checkConditionsSafety = () => {
    if (!weather) return true;
    
    const { temperature, humidity, uvIndex } = weather;
    const { temperatureThreshold, humidityThreshold, uvThreshold, sensitivity } = alertSettings;
    
    // Adjust thresholds based on sensitivity
    const tempAdjust = sensitivity === 'high' ? -2 : sensitivity === 'low' ? 2 : 0;
    const humidAdjust = sensitivity === 'high' ? -5 : sensitivity === 'low' ? 5 : 0;
    
    return (
      temperature < (temperatureThreshold + tempAdjust) &&
      humidity < (humidityThreshold + humidAdjust) &&
      uvIndex < uvThreshold
    );
  };

  const getSensitivityLabel = () => {
    switch (alertSettings.sensitivity) {
      case 'high': return 'High Sensitivity';
      case 'standard': return 'Standard';
      case 'low': return 'Low Sensitivity';
    }
  };

  const getSensitivityDescription = () => {
    switch (alertSettings.sensitivity) {
      case 'high': return 'Alerts at 27°C+ Heat Index (Caution level)';
      case 'standard': return 'Alerts at 32°C+ Heat Index (Extreme Caution level)';
      case 'low': return 'Alerts at 36°C+ Heat Index (Danger level)';
    }
  };

  const isSafe = checkConditionsSafety();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      {/* Header */}
      <header className="bg-primary text-primary-foreground py-6 px-4 shadow-lg">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">SweatSmart</h1>
            <p className="text-sm opacity-90 mt-1">Climate alerts for Hyperhidrosis warriors</p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="text-primary-foreground hover:bg-primary-foreground/10"
              onClick={() => navigate('/history')}
            >
              <Clock className="h-5 w-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="text-primary-foreground hover:bg-primary-foreground/10"
              onClick={() => navigate('/climate-settings')}
            >
              <Settings className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto p-4 space-y-4">
        {/* Test Notification Button */}
        <Button
          onClick={handleTestNotification}
          className="w-full py-6 text-lg font-semibold bg-primary hover:bg-primary/90"
          size="lg"
        >
          <Bell className="mr-2 h-5 w-5" />
          ✏️ Test Notifications
        </Button>

        {/* Safe Conditions Card */}
        <Card className={`p-6 ${isSafe ? 'border-green-500 bg-green-50' : 'border-amber-500 bg-amber-50'} border-l-4`}>
          <div className="flex items-start gap-4">
            <div className={`p-3 rounded-full ${isSafe ? 'bg-green-500' : 'bg-amber-500'}`}>
              {isSafe ? (
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <Bell className="w-8 h-8 text-white" />
              )}
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold mb-2">
                {isSafe ? 'Safe Conditions' : 'Caution Advised'}
              </h2>
              <p className="text-muted-foreground">
                {isSafe 
                  ? 'Current conditions are within safe limits for your sensitivity setting. Perfect for managing your hyperhidrosis.'
                  : 'Current conditions may trigger episodes. Stay hydrated and consider indoor activities.'}
              </p>
            </div>
          </div>
        </Card>

        {/* Current Weather Card */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold">Current Weather</h2>
            <Button
              variant="ghost"
              size="icon"
              onClick={fetchCurrentWeather}
              disabled={loading}
            >
              <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>

          {weather ? (
            <>
              <div className="flex items-center gap-2 text-muted-foreground mb-6">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span>{weather.location}</span>
              </div>

              <div className="grid grid-cols-2 gap-6 mb-6">
                <div className="text-center">
                  <Thermometer className="w-12 h-12 mx-auto mb-2 text-red-500" />
                  <div className="text-4xl font-bold">{weather.temperature.toFixed(1)}°C</div>
                  <div className="text-sm text-muted-foreground">Temperature</div>
                </div>
                <div className="text-center">
                  <Droplets className="w-12 h-12 mx-auto mb-2 text-blue-500" />
                  <div className="text-4xl font-bold">{weather.humidity}%</div>
                  <div className="text-sm text-muted-foreground">Humidity</div>
                </div>
              </div>

              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <Clock className="w-4 h-4" />
                <span>Last updated: {weather.lastUpdated}</span>
              </div>
            </>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <p>Loading weather data...</p>
            </div>
          )}
        </Card>

        {/* Alert Sensitivity Card */}
        <Card className="p-6">
          <h2 className="text-2xl font-bold mb-4">Alert Sensitivity</h2>
          <div className="mb-4">
            <div className="flex items-center justify-between">
              <span className="font-semibold">Current: {getSensitivityLabel()}</span>
              <div className="w-4 h-4 rounded-full bg-amber-500"></div>
            </div>
            <p className="text-sm text-muted-foreground mt-1">{getSensitivityDescription()}</p>
          </div>
          <Button
            variant="outline"
            className="w-full"
            onClick={() => navigate('/climate-settings')}
          >
            Change Settings
          </Button>
        </Card>

        {/* Episode Tracking */}
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-green-500/10 rounded-lg">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold">Episode Tracking</h2>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Last episode logged:</span>
              <span className="font-semibold">Never</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">4-hour reminders:</span>
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-500"></span>
                <span className="font-semibold text-green-600">Active</span>
              </span>
            </div>
          </div>
        </Card>

        {/* Climate Monitoring Status */}
        {isMonitoring && (
          <Card className="p-4 bg-green-50 border-green-200">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse"></div>
              <span className="font-semibold text-green-700">Climate monitoring active</span>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
