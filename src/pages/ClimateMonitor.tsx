import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Thermometer, Droplets, Sun, Zap, Bell, MapPin, RefreshCw } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

const PHYSIOLOGICAL_EDA_THRESHOLD = 5.0; // in µS
const LOG_INTERVAL = 4 * 60 * 60 * 1000; // 4 hours in milliseconds
const DATA_SIMULATION_INTERVAL = 5000; // 5 seconds
const LOG_CHECK_INTERVAL = 60000; // 1 minute

type PermissionStatus = 'prompt' | 'granted' | 'denied';

interface WeatherData {
  temperature: number;
  humidity: number;
  uvIndex: number;
}

interface PhysiologicalData {
  eda: number; // Electrodermal Activity in µS
}

interface Thresholds {
  temperature: number;
  humidity: number;
  uvIndex: number;
}

interface PermissionsWizardProps {
  locationStatus: PermissionStatus;
  notificationStatus: PermissionStatus;
  onRequestLocation: () => void;
  onRequestNotification: () => void;
  onCheckPermissions: () => void;
}

const PermissionsWizard = ({ 
  locationStatus, 
  notificationStatus, 
  onRequestLocation, 
  onRequestNotification, 
  onCheckPermissions 
}: PermissionsWizardProps) => {
  const isBlocked = locationStatus === 'denied' || notificationStatus === 'denied';

  return (
    <Card className="p-6 bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
      <h3 className="text-2xl font-bold text-primary mb-3 text-center">Setup Required</h3>
      <p className="text-sm text-muted-foreground text-center mb-6 max-w-md mx-auto">
        Sweat Smart needs your permission for location and notifications to provide personalized, real-time alerts.
      </p>

      <div className="space-y-3">
        {/* Location Permission */}
        <div className="flex items-center justify-between bg-card/80 p-4 rounded-lg border">
          <div className="flex items-center gap-3">
            <MapPin className={`w-6 h-6 ${locationStatus === 'granted' ? 'text-green-500' : 'text-primary'}`} />
            <span className="font-semibold">Local Weather</span>
          </div>
          {locationStatus === 'granted' && (
            <span className="text-sm font-bold text-green-500">Enabled</span>
          )}
          {locationStatus === 'prompt' && (
            <Button onClick={onRequestLocation} size="sm">
              Enable Location
            </Button>
          )}
          {locationStatus === 'denied' && (
            <span className="text-sm font-bold text-destructive">Blocked</span>
          )}
        </div>

        {/* Notification Permission */}
        <div className="flex items-center justify-between bg-card/80 p-4 rounded-lg border">
          <div className="flex items-center gap-3">
            <Bell className={`w-6 h-6 ${notificationStatus === 'granted' ? 'text-green-500' : 'text-amber-500'}`} />
            <span className="font-semibold">Climate Alerts</span>
          </div>
          {notificationStatus === 'granted' && (
            <span className="text-sm font-bold text-green-500">Enabled</span>
          )}
          {notificationStatus === 'prompt' && (
            <Button 
              onClick={onRequestNotification} 
              size="sm"
              disabled={locationStatus !== 'granted'}
              className="bg-amber-500 hover:bg-amber-600"
            >
              Enable Notifications
            </Button>
          )}
          {notificationStatus === 'denied' && (
            <span className="text-sm font-bold text-destructive">Blocked</span>
          )}
        </div>
      </div>

      {isBlocked && (
        <div className="mt-4 bg-destructive/10 border border-destructive/30 p-4 rounded-lg">
          <p className="text-sm text-destructive/90 mb-3 text-center">
            One or more permissions are blocked. Please update them in your browser's site settings for this page.
          </p>
          <Button 
            onClick={onCheckPermissions} 
            variant="outline" 
            className="w-full"
            size="sm"
          >
            <RefreshCw className="w-4 h-4 mr-2" /> Check Permissions
          </Button>
        </div>
      )}
    </Card>
  );
};

interface CurrentStatusCardProps {
  weather: WeatherData;
  physiological: PhysiologicalData;
  alertStatus: string;
  isFetching: boolean;
  weatherError: string | null;
}

const CurrentStatusCard = ({ 
  weather, 
  physiological, 
  alertStatus, 
  isFetching, 
  weatherError 
}: CurrentStatusCardProps) => {
  const statusColor = useMemo(() => {
    if (alertStatus.includes("High Risk")) return "text-destructive";
    if (alertStatus.includes("Moderate Risk")) return "text-amber-500";
    return "text-green-500";
  }, [alertStatus]);

  return (
    <Card className="p-6 relative">
      {(isFetching || weatherError) && (
        <div className="absolute inset-0 bg-background/90 flex flex-col items-center justify-center rounded-lg z-10 p-4 text-center">
          {isFetching && <p className="font-semibold animate-pulse">Fetching local weather...</p>}
          {weatherError && <p className="text-destructive font-semibold">{weatherError}</p>}
        </div>
      )}
      <h3 className="text-xl font-bold text-primary mb-4">Current Status</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        <div className="bg-muted/50 p-4 rounded-lg text-center">
          <Thermometer className="w-8 h-8 mx-auto text-red-500 mb-2" />
          <p className="text-2xl font-bold">{weather.temperature.toFixed(1)}°C</p>
          <p className="text-xs text-muted-foreground">Temp</p>
        </div>
        <div className="bg-muted/50 p-4 rounded-lg text-center">
          <Droplets className="w-8 h-8 mx-auto text-blue-500 mb-2" />
          <p className="text-2xl font-bold">{weather.humidity.toFixed(0)}%</p>
          <p className="text-xs text-muted-foreground">Humidity</p>
        </div>
        <div className="bg-muted/50 p-4 rounded-lg text-center">
          <Sun className="w-8 h-8 mx-auto text-amber-500 mb-2" />
          <p className="text-2xl font-bold">{weather.uvIndex.toFixed(1)}</p>
          <p className="text-xs text-muted-foreground">UV Index</p>
        </div>
        <div className="bg-muted/50 p-4 rounded-lg text-center">
          <Zap className="w-8 h-8 mx-auto text-purple-500 mb-2" />
          <p className="text-2xl font-bold">{physiological.eda.toFixed(1)} µS</p>
          <p className="text-xs text-muted-foreground">EDA</p>
        </div>
      </div>
      <div className={`bg-muted/50 p-4 rounded-lg text-center ${statusColor}`}>
        <p className="font-semibold text-lg">{alertStatus}</p>
      </div>
    </Card>
  );
};

interface SettingsPanelProps {
  thresholds: Thresholds;
  onThresholdChange: (key: keyof Thresholds, value: number) => void;
}

const SettingsPanel = ({ thresholds, onThresholdChange }: SettingsPanelProps) => {
  return (
    <Card className="p-6">
      <h3 className="text-xl font-bold text-primary mb-4">Alert Thresholds</h3>
      <div className="space-y-6">
        <div>
          <label className="flex justify-between text-sm font-medium mb-2">
            <span>Temperature</span>
            <span className="font-bold">{thresholds.temperature}°C</span>
          </label>
          <input 
            type="range" 
            min="15" 
            max="40" 
            value={thresholds.temperature} 
            onChange={(e) => onThresholdChange('temperature', +e.target.value)} 
            className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
          />
        </div>
        <div>
          <label className="flex justify-between text-sm font-medium mb-2">
            <span>Humidity</span>
            <span className="font-bold">{thresholds.humidity}%</span>
          </label>
          <input 
            type="range" 
            min="30" 
            max="100" 
            value={thresholds.humidity} 
            onChange={(e) => onThresholdChange('humidity', +e.target.value)} 
            className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
          />
        </div>
        <div>
          <label className="flex justify-between text-sm font-medium mb-2">
            <span>UV Index</span>
            <span className="font-bold">{thresholds.uvIndex}</span>
          </label>
          <input 
            type="range" 
            min="0" 
            max="11" 
            step="1" 
            value={thresholds.uvIndex} 
            onChange={(e) => onThresholdChange('uvIndex', +e.target.value)} 
            className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
          />
        </div>
      </div>
    </Card>
  );
};

interface CompulsoryLoggingProps {
  nextLogTime: number | null;
  onLogNow: () => void;
}

const CompulsoryLogging = ({ nextLogTime, onLogNow }: CompulsoryLoggingProps) => {
  const [timeRemaining, setTimeRemaining] = useState<string>('');

  useEffect(() => {
    const updateTimer = () => {
      if (!nextLogTime) {
        setTimeRemaining('Ready to log');
        return;
      }
      
      const diff = nextLogTime - Date.now();
      if (diff <= 0) {
        setTimeRemaining('Time to log!');
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      setTimeRemaining(`${hours}h ${minutes}m ${seconds}s`);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [nextLogTime]);

  return (
    <Card className="p-6 bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-500/20">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-green-500/10 rounded-lg">
          <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
        </div>
        <h3 className="text-xl font-bold">Compulsory Logging</h3>
      </div>
      
      <p className="text-sm text-muted-foreground mb-4">
        Log your sweat level every 4 hours to track patterns and improve predictions.
      </p>

      <div className="bg-muted/50 p-4 rounded-lg mb-4 text-center">
        <p className="text-sm text-muted-foreground mb-1">Next log due in:</p>
        <p className="text-3xl font-bold text-primary">{timeRemaining}</p>
      </div>

      <Button 
        onClick={onLogNow} 
        className="w-full bg-green-600 hover:bg-green-700"
        size="lg"
      >
        Log New Episode
      </Button>
    </Card>
  );
};

export default function ClimateMonitor() {
  const navigate = useNavigate();
  
  const [notificationPermission, setNotificationPermission] = useState<PermissionStatus>('prompt');
  const [locationPermission, setLocationPermission] = useState<PermissionStatus>('prompt');
  const [location, setLocation] = useState<GeolocationCoordinates | null>(null);

  const [isFetchingWeather, setIsFetchingWeather] = useState(false);
  const [weatherError, setWeatherError] = useState<string | null>(null);
  const [weatherData, setWeatherData] = useState<WeatherData>({ 
    temperature: 20, 
    humidity: 50, 
    uvIndex: 3 
  });
  const [physiologicalData, setPhysiologicalData] = useState<PhysiologicalData>({ eda: 2.5 });

  const [thresholds, setThresholds] = useState<Thresholds>(() => {
    const saved = localStorage.getItem('sweatSmartThresholds');
    return saved ? JSON.parse(saved) : { temperature: 24, humidity: 70, uvIndex: 6 };
  });

  const [nextLogTime, setNextLogTime] = useState<number | null>(null);
  const [alertStatus, setAlertStatus] = useState("Complete setup to begin.");

  const arePermissionsGranted = locationPermission === 'granted' && notificationPermission === 'granted';

  // Check permissions
  const checkPermissions = useCallback(async () => {
    if ('permissions' in navigator) {
      try {
        const [notifStatus, geoStatus] = await Promise.all([
          navigator.permissions.query({ name: 'notifications' as PermissionName }),
          navigator.permissions.query({ name: 'geolocation' as PermissionName })
        ]);
        setNotificationPermission(notifStatus.state as PermissionStatus);
        setLocationPermission(geoStatus.state as PermissionStatus);

        notifStatus.onchange = () => setNotificationPermission(notifStatus.state as PermissionStatus);
        geoStatus.onchange = () => setLocationPermission(geoStatus.state as PermissionStatus);
      } catch (error) {
        console.error('Error checking permissions:', error);
      }
    } else {
      const perm = Notification.permission;
      setNotificationPermission(perm === 'default' ? 'prompt' : perm as PermissionStatus);
    }
  }, []);

  useEffect(() => {
    checkPermissions();
  }, [checkPermissions]);

  useEffect(() => {
    localStorage.setItem('sweatSmartThresholds', JSON.stringify(thresholds));
  }, [thresholds]);

  // Fetch weather data
  const fetchWeatherData = useCallback(async (coords: GeolocationCoordinates) => {
    setIsFetchingWeather(true);
    setWeatherError(null);
    try {
      const apiKey = import.meta.env.VITE_WEATHER_API_KEY || 'a6b12b63b919897556487f32942e2d2f';
      const response = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?lat=${coords.latitude}&lon=${coords.longitude}&units=metric&appid=${apiKey}`
      );
      const data = await response.json();
      
      if (data && data.main) {
        setWeatherData({
          temperature: data.main.temp,
          humidity: data.main.humidity,
          uvIndex: 5, // UV data requires separate API call or estimation
        });
      }
    } catch (error) {
      console.error("Error fetching weather data:", error);
      setWeatherError("Could not fetch weather. Using simulated data.");
    } finally {
      setIsFetchingWeather(false);
    }
  }, []);

  useEffect(() => {
    if (location) {
      fetchWeatherData(location);
    }
  }, [location, fetchWeatherData]);

  // Simulate data when permissions not granted
  useEffect(() => {
    if (arePermissionsGranted) return;

    const interval = setInterval(() => {
      setWeatherData(prev => ({
        temperature: prev.temperature + (Math.random() - 0.5) * 0.5,
        humidity: Math.max(0, Math.min(100, prev.humidity + (Math.random() - 0.5) * 2)),
        uvIndex: Math.max(0, Math.min(11, prev.uvIndex + (Math.random() - 0.5) * 0.2)),
      }));
    }, DATA_SIMULATION_INTERVAL);
    return () => clearInterval(interval);
  }, [arePermissionsGranted]);

  // Simulate EDA
  useEffect(() => {
    const interval = setInterval(() => {
      setPhysiologicalData(prev => ({
        eda: Math.max(0, prev.eda + (Math.random() - 0.45) * 0.5)
      }));
    }, DATA_SIMULATION_INTERVAL);
    return () => clearInterval(interval);
  }, []);

  // Alert logic
  useEffect(() => {
    if (!arePermissionsGranted) {
      setAlertStatus("Complete setup to begin.");
      return;
    }

    const isEnvTrigger = weatherData.temperature > thresholds.temperature || 
                         weatherData.humidity > thresholds.humidity || 
                         weatherData.uvIndex > thresholds.uvIndex;
    const isPhysioTrigger = physiologicalData.eda > PHYSIOLOGICAL_EDA_THRESHOLD;

    if (isEnvTrigger && isPhysioTrigger) {
      setAlertStatus("High Risk: Conditions and physiology indicate high sweat risk.");
    } else if (isEnvTrigger) {
      setAlertStatus("Moderate Risk: Climate conditions may trigger sweating.");
    } else {
      setAlertStatus("Conditions Optimal: Low sweat risk detected.");
    }
  }, [weatherData, physiologicalData, thresholds, arePermissionsGranted]);

  // Setup next log time
  useEffect(() => {
    const lastLog = localStorage.getItem('lastLogTime');
    const startTime = lastLog ? parseInt(lastLog) : Date.now();
    setNextLogTime(startTime + LOG_INTERVAL);
  }, []);

  // Request location permission
  const handleRequestLocation = () => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation(position.coords);
        setLocationPermission('granted');
        toast.success('Location access granted');
      },
      (error) => {
        console.error("Geolocation error:", error);
        if (error.code === error.PERMISSION_DENIED) {
          setLocationPermission('denied');
          toast.error('Location access denied');
        }
      }
    );
  };

  // Request notification permission
  const requestNotificationPermission = async () => {
    if (locationPermission !== 'granted') {
      toast.error('Please enable location first');
      return;
    }
    const permission = await Notification.requestPermission();
    setNotificationPermission(permission === 'default' ? 'prompt' : permission as PermissionStatus);
    
    if (permission === 'granted') {
      toast.success('Notifications enabled!');
    } else {
      toast.error('Notifications denied');
    }
  };

  const handleThresholdChange = (key: keyof Thresholds, value: number) => {
    setThresholds(prev => ({ ...prev, [key]: value }));
  };

  const handleSimulateEDASpike = () => {
    setPhysiologicalData(prev => ({ eda: prev.eda + 5 }));
    toast.info('EDA spike simulated!');
  };

  const handleLogNow = () => {
    // Navigate to the main SweatSmart dashboard where users can log episodes
    navigate('/dashboard');
    toast.info('Navigate to dashboard to log your episode');
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto p-4 sm:p-6 space-y-6">
        <header className="text-center py-4">
          <h1 className="text-4xl font-bold text-primary">Sweat Smart</h1>
          <p className="text-muted-foreground text-lg mt-2">Your Climate-Aware Companion</p>
        </header>

        {!arePermissionsGranted && (
          <PermissionsWizard
            locationStatus={locationPermission}
            notificationStatus={notificationPermission}
            onRequestLocation={handleRequestLocation}
            onRequestNotification={requestNotificationPermission}
            onCheckPermissions={checkPermissions}
          />
        )}

        <div className={`space-y-6 transition-all duration-500 ${
          arePermissionsGranted ? 'opacity-100' : 'opacity-40 blur-sm pointer-events-none'
        }`}>
          <CurrentStatusCard 
            weather={weatherData} 
            physiological={physiologicalData} 
            alertStatus={alertStatus} 
            isFetching={isFetchingWeather} 
            weatherError={weatherError} 
          />

          <Button 
            onClick={handleSimulateEDASpike} 
            className="w-full bg-purple-600 hover:bg-purple-700"
            size="lg"
          >
            Simulate EDA Spike
          </Button>

          <SettingsPanel 
            thresholds={thresholds} 
            onThresholdChange={handleThresholdChange} 
          />

          <CompulsoryLogging 
            nextLogTime={nextLogTime} 
            onLogNow={handleLogNow} 
          />
        </div>
      </div>
    </div>
  );
}
