import { useState, useEffect, useCallback, useMemo } from 'react';
import AppLayout from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { LoggingSystem } from "../components/climate/LoggingSystem";
import { SettingsPanel } from "../components/climate/SettingsPanel";
import { History, Settings as SettingsIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from '@/integrations/supabase/client';
import { edaManager } from '@/utils/edaManager';
import type { WeatherData, PhysiologicalData, Thresholds, LogEntry, HDSSLevel } from "@/types";
import { soundManager } from '@/utils/soundManager';

// Icons
const ThermometerIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg {...props} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
  </svg>
);

const DropletIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg {...props} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
  </svg>
);

const SunIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg {...props} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h1M3 12H2m15.364 6.364l-.707.707M6.343 6.343l-.707-.707m12.728 0l-.707-.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"></path>
  </svg>
);

const ZapIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg {...props} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
  </svg>
);

const BellIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg {...props} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path>
  </svg>
);

const MapPinIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg {...props} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
  </svg>
);

const RefreshIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg {...props} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356-2A8.001 8.001 0 004 12c0 2.127.766 4.047 2.031 5.488M16 20v-5h.582m-15.356 2A8.001 8.001 0 0020 12c0-2.127-.766-4.047-2.031-5.488"></path>
  </svg>
);

const PHYSIOLOGICAL_EDA_THRESHOLD = 5.0;
const TESTING_MODE = true; // Set to false for production
const LOG_INTERVAL = TESTING_MODE ? 10 * 60 * 1000 : 4 * 60 * 60 * 1000; // 10 min (test) or 4 hours (prod)
const DATA_SIMULATION_INTERVAL = 5000;
const LOG_CHECK_INTERVAL = 30000; // Check every 30 seconds
const WEATHER_REFRESH_INTERVAL = 5 * 60 * 1000; // Refresh weather every 5 minutes

type PermissionStatus = 'prompt' | 'granted' | 'denied';

// Using shared SoundManager for all alert sounds (see utils/soundManager).

// Permissions Wizard Component
const PermissionsWizard: React.FC<{
  locationStatus: PermissionStatus;
  notificationStatus: PermissionStatus;
  onRequestLocation: () => void;
  onRequestNotification: () => void;
  onCheckPermissions: () => void;
}> = ({ locationStatus, notificationStatus, onRequestLocation, onRequestNotification, onCheckPermissions }) => {
  const isBlocked = locationStatus === 'denied' || notificationStatus === 'denied';

  return (
    <div className="bg-gray-800 border border-cyan-700/50 text-white p-6 rounded-xl space-y-4">
      <h3 className="text-2xl font-bold text-cyan-300">Setup Required</h3>
      <p className="text-gray-400">
        Sweat Smart needs your permission for location and notifications to provide personalized, real-time alerts.
      </p>

      <div className="space-y-3 pt-4">
        <div className="flex items-center justify-between bg-gray-900/70 p-4 rounded-lg">
          <div className="flex items-center space-x-3">
            <MapPinIcon className={`w-6 h-6 ${locationStatus === 'granted' ? 'text-green-400' : 'text-blue-400'}`} />
            <span className="font-semibold">Local Weather</span>
          </div>
          {locationStatus === 'granted' && <span className="text-sm font-bold text-green-400">Enabled</span>}
          {locationStatus === 'prompt' && (
            <button onClick={onRequestLocation} className="bg-blue-500 text-white text-sm font-bold px-4 py-2 rounded-md hover:bg-blue-400 transition">
              Enable Location
            </button>
          )}
          {locationStatus === 'denied' && <span className="text-sm font-bold text-red-400">Blocked</span>}
        </div>

        <div className="flex items-center justify-between bg-gray-900/70 p-4 rounded-lg">
          <div className="flex items-center space-x-3">
            <BellIcon className={`w-6 h-6 ${notificationStatus === 'granted' ? 'text-green-400' : 'text-yellow-400'}`} />
            <span className="font-semibold">Climate Alerts</span>
          </div>
          {notificationStatus === 'granted' && <span className="text-sm font-bold text-green-400">Enabled</span>}
          {notificationStatus === 'prompt' && (
            <button 
              onClick={onRequestNotification} 
              className="bg-yellow-500 text-black text-sm font-bold px-4 py-2 rounded-md hover:bg-yellow-400 transition disabled:bg-gray-600" 
              disabled={locationStatus !== 'granted'}
            >
              Enable Notifications
            </button>
          )}
          {notificationStatus === 'denied' && <span className="text-sm font-bold text-red-400">Blocked</span>}
        </div>
      </div>

      {isBlocked && (
        <div className="bg-red-900/50 border border-red-700 p-4 rounded-lg">
          <p className="text-sm text-red-200 mb-3">
            One or more permissions are blocked. Please update them in your browser's site settings for this page.
          </p>
          <button 
            onClick={onCheckPermissions} 
            className="flex items-center gap-2 bg-gray-200 text-black font-bold px-4 py-2 rounded-md hover:bg-white transition text-sm"
          >
            <RefreshIcon className="w-4 h-4" /> Check Permissions
          </button>
        </div>
      )}
    </div>
  );
};

// Current Status Card
const CurrentStatusCard: React.FC<{
  weather: WeatherData;
  physiological: PhysiologicalData;
  alertStatus: string;
  isFetching: boolean;
  weatherError: string | null;
}> = ({ weather, physiological, alertStatus, isFetching, weatherError }) => {
  const statusColor = useMemo(() => {
    if (alertStatus.includes("High Risk")) return "text-red-400";
    if (alertStatus.includes("Moderate Risk")) return "text-yellow-400";
    return "text-green-400";
  }, [alertStatus]);

  return (
    <div className="relative bg-gray-800/50 border border-gray-700 rounded-xl p-6 space-y-4">
      {(isFetching || weatherError) && (
        <div className="absolute inset-0 bg-gray-800/90 flex flex-col items-center justify-center rounded-xl z-10">
          {isFetching && <p className="text-white font-semibold animate-pulse">Fetching local weather...</p>}
          {weatherError && <p className="text-red-400 font-semibold">{weatherError}</p>}
        </div>
      )}
      <h3 className="text-xl font-bold text-cyan-300">Current Status</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gray-900 p-4 rounded-lg text-center">
          <ThermometerIcon className="w-8 h-8 mx-auto text-red-400 mb-2" />
          <p className="text-2xl font-bold">{weather.temperature.toFixed(1)}°C</p>
          <p className="text-xs text-gray-400">Temperature</p>
        </div>
        <div className="bg-gray-900 p-4 rounded-lg text-center">
          <DropletIcon className="w-8 h-8 mx-auto text-blue-400 mb-2" />
          <p className="text-2xl font-bold">{weather.humidity.toFixed(0)}%</p>
          <p className="text-xs text-gray-400">Humidity</p>
        </div>
        <div className="bg-gray-900 p-4 rounded-lg text-center">
          <SunIcon className="w-8 h-8 mx-auto text-yellow-400 mb-2" />
          <p className="text-2xl font-bold">{weather.uvIndex.toFixed(1)}</p>
          <p className="text-xs text-gray-400">UV Index</p>
        </div>
        <div className="bg-gray-900 p-4 rounded-lg text-center">
          <ZapIcon className="w-8 h-8 mx-auto text-purple-400 mb-2" />
          <p className="text-2xl font-bold">{physiological.eda.toFixed(1)} µS</p>
          <p className="text-xs text-gray-400">EDA</p>
        </div>
      </div>
      <div className={`bg-gray-900 p-4 rounded-lg text-center ${statusColor}`}>
        <p className="text-lg font-semibold">{alertStatus}</p>
      </div>
    </div>
  );
};

const ClimateMonitor = () => {
  const navigate = useNavigate();
  const [notificationPermission, setNotificationPermission] = useState<PermissionStatus>('prompt');
  const [locationPermission, setLocationPermission] = useState<PermissionStatus>('prompt');
  const [location, setLocation] = useState<GeolocationCoordinates | null>(null);

  const [isFetchingWeather, setIsFetchingWeather] = useState(false);
  const [weatherError, setWeatherError] = useState<string | null>(null);
  const [weatherData, setWeatherData] = useState<WeatherData>({ temperature: 20, humidity: 50, uvIndex: 3 });
  const [physiologicalData, setPhysiologicalData] = useState<PhysiologicalData>({ eda: 2.5 });

  const [thresholds, setThresholds] = useState<Thresholds>(() => {
    const saved = localStorage.getItem('sweatSmartThresholds');
    return saved ? JSON.parse(saved) : { temperature: 24, humidity: 70, uvIndex: 6 };
  });

  const [logs, setLogs] = useState<LogEntry[]>(() => {
    const saved = localStorage.getItem('sweatSmartLogs');
    return saved ? JSON.parse(saved) : [];
  });

  const [isLoggingModalOpen, setIsLoggingModalOpen] = useState(false);
  const [nextLogTime, setNextLogTime] = useState<number | null>(null);
  const [alertStatus, setAlertStatus] = useState("Complete setup to begin.");

  const arePermissionsGranted = locationPermission === 'granted' && notificationPermission === 'granted';

  // Check permissions
  const checkPermissions = useCallback(async () => {
    if ('permissions' in navigator) {
      const [notifStatus, geoStatus] = await Promise.all([
        navigator.permissions.query({ name: 'notifications' }),
        navigator.permissions.query({ name: 'geolocation' })
      ]);
      setNotificationPermission(notifStatus.state);
      setLocationPermission(geoStatus.state);

      notifStatus.onchange = () => setNotificationPermission(notifStatus.state);
      geoStatus.onchange = () => setLocationPermission(geoStatus.state);
    } else {
      const perm = Notification.permission;
      setNotificationPermission(perm === 'default' ? 'prompt' : perm);
    }
  }, []);

  useEffect(() => {
    checkPermissions();
  }, [checkPermissions]);

  // Load EDA from Palm Scanner on mount
  useEffect(() => {
    const storedEDA = edaManager.getEDA();
    if (storedEDA && edaManager.isFresh()) {
      setPhysiologicalData({ eda: storedEDA.value });
      console.log('Loaded fresh EDA from Palm Scanner:', storedEDA);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('sweatSmartThresholds', JSON.stringify(thresholds));
  }, [thresholds]);

  useEffect(() => {
    localStorage.setItem('sweatSmartLogs', JSON.stringify(logs));
  }, [logs]);

  // Fetch weather
  const fetchWeatherData = useCallback(async (coords: GeolocationCoordinates) => {
    setIsFetchingWeather(true);
    setWeatherError(null);
    try {
      const { data, error } = await supabase.functions.invoke('get-weather-data', {
        body: { latitude: coords.latitude, longitude: coords.longitude }
      });
      
      if (error) throw error;
      
      if (data.simulated) {
        setWeatherError(data.error || 'Using simulated data');
        setWeatherData(data.data);
      } else {
        setWeatherData(data);
      }
    } catch (error) {
      console.error("Error fetching weather:", error);
      setWeatherError("Could not fetch weather. Using simulated data.");
      // Fallback to simulation
      setWeatherData({ temperature: 22, humidity: 60, uvIndex: 4 });
    } finally {
      setIsFetchingWeather(false);
    }
  }, []);

  // Fetch weather on mount and refresh periodically
  useEffect(() => {
    if (location) {
      fetchWeatherData(location);
      
      // Refresh weather data periodically
      const weatherInterval = setInterval(() => {
        console.log('🌤️ Refreshing weather data...');
        fetchWeatherData(location);
      }, WEATHER_REFRESH_INTERVAL);
      
      return () => clearInterval(weatherInterval);
    }
  }, [location, fetchWeatherData]);

  // Simulate data when not connected
  useEffect(() => {
    if (arePermissionsGranted && !weatherError) return;

    const interval = setInterval(() => {
      setWeatherData(prev => ({
        temperature: prev.temperature + (Math.random() - 0.5) * 0.5,
        humidity: Math.max(0, Math.min(100, prev.humidity + (Math.random() - 0.5) * 2)),
        uvIndex: Math.max(0, Math.min(11, prev.uvIndex + (Math.random() - 0.5) * 0.2)),
      }));
    }, DATA_SIMULATION_INTERVAL);
    return () => clearInterval(interval);
  }, [arePermissionsGranted, weatherError]);

  // Physiological simulation
  useEffect(() => {
    const interval = setInterval(() => {
      setPhysiologicalData(prev => ({
        eda: Math.max(0, prev.eda + (Math.random() - 0.45) * 0.5)
      }));
    }, DATA_SIMULATION_INTERVAL);
    return () => clearInterval(interval);
  }, []);

  // Sound using shared SoundManager
  const playAlertSound = useCallback(
    (severity: 'CRITICAL' | 'WARNING' | 'REMINDER' = 'WARNING') => {
      soundManager.triggerMedicalAlert(severity);
    },
    []
  );

  const sendNotification = useCallback(
    (title: string, body: string, severity: 'CRITICAL' | 'WARNING' | 'REMINDER' = 'WARNING') => {
      // Always attempt to play sound, even if system notifications are blocked
      playAlertSound(severity);

      if (notificationPermission === 'granted') {
        new Notification(title, { body, icon: '/favicon.ico' });
      }
    },
    [notificationPermission, playAlertSound]
  );

  // Alert logic with sound alerts
  useEffect(() => {
    if (!arePermissionsGranted) {
      setAlertStatus("Complete setup to begin.");
      return;
    }

    // Check if sound alerts are enabled
    const settings = localStorage.getItem('climateAppSettings');
    const soundEnabled = settings ? JSON.parse(settings).soundAlerts !== false : true;

    const isEnvTrigger = weatherData.temperature > thresholds.temperature || 
                         weatherData.humidity > thresholds.humidity || 
                         weatherData.uvIndex > thresholds.uvIndex;
    const isPhysioTrigger = physiologicalData.eda > PHYSIOLOGICAL_EDA_THRESHOLD;

    if (isEnvTrigger && isPhysioTrigger) {
      setAlertStatus("High Risk: Conditions and physiology indicate high sweat risk.");
      if (soundEnabled) {
        sendNotification(
          'Sweat Smart Alert',
          'High sweat risk detected based on climate and body signals.',
          'CRITICAL'
        );
      }
    } else if (isEnvTrigger) {
      setAlertStatus("Moderate Risk: Climate conditions may trigger sweating.");
      if (soundEnabled) {
        sendNotification(
          'Sweat Smart Alert',
          'Moderate sweat risk detected. Consider logging your episode.',
          'WARNING'
        );
      }
    } else {
      setAlertStatus("Conditions Optimal: Low sweat risk detected.");
    }
  }, [weatherData, physiologicalData, thresholds, sendNotification, arePermissionsGranted]);

  // Logging logic - 10 min interval for testing, 4-hour blocks for production
  const updateNextLogTime = useCallback(() => {
    const now = Date.now();
    let nextTime: number;
    
    if (TESTING_MODE) {
      // Testing: next log in 10 minutes
      nextTime = now + LOG_INTERVAL;
    } else {
      // Production: Fixed 4-hour blocks
      const blocks = [0, 4, 8, 12, 16, 20];
      const currentDate = new Date();
      const currentHour = currentDate.getHours();
      
      let nextBlockHour = blocks.find(block => block > currentHour);
      
      const next = new Date(currentDate);
      if (nextBlockHour === undefined) {
        next.setDate(next.getDate() + 1);
        nextBlockHour = 0;
      }
      
      next.setHours(nextBlockHour, 0, 0, 0);
      nextTime = next.getTime();
    }

    setNextLogTime(nextTime);
    localStorage.setItem('climateNextLogTime', nextTime.toString());
    console.log('📅 Next log time set to:', new Date(nextTime).toLocaleString());
  }, []);

  useEffect(() => {
    const stored = localStorage.getItem('climateNextLogTime');
    const storedTime = stored ? parseInt(stored, 10) : NaN;

    if (storedTime && storedTime > Date.now()) {
      setNextLogTime(storedTime);
    } else {
      updateNextLogTime();
    }
  }, [updateNextLogTime]);

  // Listen for global log reminder events (from LoggingReminderService)
  useEffect(() => {
    const handleLogReminder = () => {
      console.log('📅 ClimateMonitor: Received log reminder event');
      if (arePermissionsGranted) {
        setIsLoggingModalOpen(true);
      }
    };

    window.addEventListener('sweatsmart-log-reminder', handleLogReminder);
    return () => window.removeEventListener('sweatsmart-log-reminder', handleLogReminder);
  }, [arePermissionsGranted]);

  // Also check locally when on the page (backup mechanism)
  useEffect(() => {
    const interval = setInterval(() => {
      if (nextLogTime && Date.now() >= nextLogTime && arePermissionsGranted) {
        // Professional reminder sound for compulsory logging
        playAlertSound('REMINDER');

        if (notificationPermission === 'granted') {
          new Notification('Time to Log', {
            body: 'Please record your sweat level for the last 4 hours.',
            icon: '/favicon.ico',
            requireInteraction: true
          });
        }
        setIsLoggingModalOpen(true);
        updateNextLogTime();
      }
    }, LOG_CHECK_INTERVAL);

    return () => clearInterval(interval);
  }, [nextLogTime, arePermissionsGranted, playAlertSound, notificationPermission, updateNextLogTime]);

  // Handlers
  const requestNotificationPermission = async () => {
    if (locationPermission !== 'granted') return;
    const permission = await Notification.requestPermission();
    setNotificationPermission(permission === 'default' ? 'prompt' : permission);
  };

  const handleRequestLocation = () => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation(position.coords);
        setLocationPermission('granted');
        // After location granted, request notification
        if (notificationPermission === 'prompt') {
          requestNotificationPermission();
        }
      },
      (error) => {
        console.error("Geolocation error:", error);
        if (error.code === error.PERMISSION_DENIED) {
          setLocationPermission('denied');
        }
      }
    );
  };

  const handleThresholdChange = (key: keyof Thresholds, value: number) => {
    setThresholds(prev => ({ ...prev, [key]: value }));
  };

  const handleLogSubmit = (level: HDSSLevel) => {
    const newLog: LogEntry = {
      id: new Date().toISOString(),
      timestamp: Date.now(),
      hdssLevel: level,
      weather: weatherData,
      physiologicalData: physiologicalData
    };
    setLogs(prev => [...prev, newLog]);
    setIsLoggingModalOpen(false);
  };

  return (
    <AppLayout>
      <div className="min-h-full bg-gradient-to-br from-blue-600 via-blue-500 to-cyan-400 p-6 rounded-xl space-y-6">
        {/* Testing Mode Banner */}
        {TESTING_MODE && (
          <div className="bg-yellow-500/20 border border-yellow-500/50 text-yellow-200 px-4 py-2 rounded-lg text-sm font-medium flex items-center justify-between">
            <span>🧪 Testing Mode: Log reminders every 10 minutes</span>
            <span className="text-xs text-yellow-300">Set TESTING_MODE=false for production</span>
          </div>
        )}
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white drop-shadow-lg">Sweat Smart Climate Alerts</h1>
            <p className="text-white/80 mt-1">Real-time weather monitoring and personalized alerts</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            {/* Refresh Weather Button */}
            {location && (
              <Button 
                className="bg-cyan-600 text-white hover:bg-cyan-500" 
                onClick={() => fetchWeatherData(location)}
                disabled={isFetchingWeather}
              >
                <RefreshIcon className={`h-4 w-4 mr-2 ${isFetchingWeather ? 'animate-spin' : ''}`} />
                {isFetchingWeather ? 'Refreshing...' : 'Refresh'}
              </Button>
            )}
            <Button 
              className="bg-gray-900 text-white border-gray-700 hover:bg-gray-800" 
              onClick={() => navigate('/climate/history')}
            >
              <History className="h-4 w-4 mr-2" />
              History
            </Button>
            <Button 
              className="bg-gray-900 text-white border-gray-700 hover:bg-gray-800" 
              onClick={() => navigate('/climate/settings')}
            >
              <SettingsIcon className="h-4 w-4 mr-2" />
              Settings
            </Button>
          </div>
        </div>

        {/* Permissions Wizard */}
        {!arePermissionsGranted && (
          <PermissionsWizard
            locationStatus={locationPermission}
            notificationStatus={notificationPermission}
            onRequestLocation={handleRequestLocation}
            onRequestNotification={requestNotificationPermission}
            onCheckPermissions={checkPermissions}
          />
        )}

        {/* Main Content */}
        <div className={`space-y-6 transition-opacity duration-500 ${arePermissionsGranted ? 'opacity-100' : 'opacity-40 blur-sm pointer-events-none'}`}>
          <CurrentStatusCard
            weather={weatherData}
            physiological={physiologicalData}
            alertStatus={alertStatus}
            isFetching={isFetchingWeather}
            weatherError={weatherError}
          />

          <div className="space-y-4">
            {/* EDA Status Badge */}
            <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Electrodermal Activity (EDA)</p>
                  <p className="text-2xl font-bold text-purple-400">{physiologicalData.eda.toFixed(1)} µS</p>
                </div>
                {(() => {
                  const storedEDA = edaManager.getEDA();
                  const isFresh = edaManager.isFresh();
                  if (storedEDA && isFresh) {
                    return (
                      <span className="text-xs bg-green-500/20 text-green-400 px-3 py-1 rounded-full border border-green-500/50">
                        Fresh • {storedEDA.source}
                      </span>
                    );
                  } else if (storedEDA && !isFresh) {
                    return (
                      <span className="text-xs bg-yellow-500/20 text-yellow-400 px-3 py-1 rounded-full border border-yellow-500/50">
                        Stale • Generate new
                      </span>
                    );
                  }
                  return (
                    <span className="text-xs bg-gray-500/20 text-gray-400 px-3 py-1 rounded-full border border-gray-500/50">
                      No data
                    </span>
                  );
                })()}
              </div>
            </div>

            {/* Go to Palm Scanner Button */}
            <button
              onClick={() => {
                // Determine mode based on current EDA level
                const eda = physiologicalData.eda;
                let mode = 'Resting';
                if (eda > 10) mode = 'Trigger';
                else if (eda > 5) mode = 'Active';
                navigate(`/palm-scanner?returnTo=/climate&mode=${mode}`);
              }}
              className="w-full py-3 bg-purple-600 hover:bg-purple-500 rounded-lg transition-colors font-semibold flex items-center justify-center gap-2"
            >
              <ZapIcon className="w-5 h-5" />
              Go to Palm Scanner
            </button>
          </div>

          <SettingsPanel thresholds={thresholds} onThresholdChange={handleThresholdChange} />

          <LoggingSystem
            logs={logs}
            isModalOpen={isLoggingModalOpen}
            onCloseModal={() => setIsLoggingModalOpen(false)}
            onSubmitLog={handleLogSubmit}
            onLogNow={() => navigate('/log-episode')}
            nextLogTime={nextLogTime}
          />

          {/* Test & Debug Section */}
          <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4 space-y-4">
            <p className="text-sm font-semibold text-cyan-300">Testing & Debug</p>
            
            <div className="flex flex-wrap gap-2">
              <Button
                onClick={async () => {
                  playAlertSound('WARNING');
                  // Use enhanced service for in-app notification fallback
                  const { enhancedMobileNotificationService } = await import('@/services/EnhancedMobileNotificationService');
                  await enhancedMobileNotificationService.showNotification(
                    '✅ Test Alert',
                    'Your alerts are working correctly! 🎉',
                    'success'
                  );
                  
                  // Also test service worker notification
                  if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
                    navigator.serviceWorker.controller.postMessage({ type: 'TEST_NOTIFICATION' });
                  }
                }}
                className="bg-cyan-600 hover:bg-cyan-500 text-white"
              >
                Test Alert
              </Button>
              
              {/* Reset Timer for Testing */}
              <Button
                onClick={() => {
                  // Set next log time to 10 seconds from now for immediate testing
                  const testTime = Date.now() + 10000;
                  localStorage.setItem('climateNextLogTime', testTime.toString());
                  localStorage.removeItem('lastLogAlertTime');
                  setNextLogTime(testTime);
                  
                  // Sync with service worker
                  if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
                    navigator.serviceWorker.controller.postMessage({
                      type: 'SYNC_LOG_REMINDER',
                      nextLogTime: testTime
                    });
                  }
                  
                  alert('Timer reset! Log reminder will trigger in ~10 seconds.');
                }}
                className="bg-yellow-600 hover:bg-yellow-500 text-white"
              >
                🧪 Trigger in 10s
              </Button>
            </div>
            
            <p className="text-xs text-gray-400">
              Test Alert verifies sound/notifications. "Trigger in 10s" tests the log reminder system.
            </p>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default ClimateMonitor;
