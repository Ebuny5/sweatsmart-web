import { useState, useEffect, useCallback, useMemo } from 'react';
import AppLayout from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { GoogleGenAI, Type } from "@google/genai";
import { LoggingSystem } from "@/components/climate/LoggingSystem";
import { SettingsPanel } from "@/components/climate/SettingsPanel";
import { History, Settings as SettingsIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";
import type { WeatherData, PhysiologicalData, Thresholds, LogEntry, HDSSLevel } from "@/types";

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
const LOG_INTERVAL = 4 * 60 * 60 * 1000;
const DATA_SIMULATION_INTERVAL = 5000;
const LOG_CHECK_INTERVAL = 60000;

type PermissionStatus = 'prompt' | 'granted' | 'denied';

// Store AudioContext globally
let audioContext: AudioContext | null = null;
const initAudioContext = () => {
  if (!audioContext) {
    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  return audioContext;
};

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
      const apiKey = import.meta.env.VITE_GOOGLE_AI_API_KEY;
      if (!apiKey) {
        throw new Error("API Key for Google GenAI is not defined.");
      }
      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: "gemini-2.0-flash-exp",
        contents: `What is the current temperature in Celsius, humidity percentage, and UV index for latitude ${coords.latitude} and longitude ${coords.longitude}? Provide only the JSON object.`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              temperature: { type: Type.NUMBER },
              humidity: { type: Type.NUMBER },
              uvIndex: { type: Type.NUMBER },
            },
            required: ["temperature", "humidity", "uvIndex"],
          },
        },
      });
      const weather = JSON.parse(response.text) as WeatherData;
      setWeatherData(weather);
    } catch (error) {
      console.error("Error fetching weather:", error);
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

  // Sound
  const playNotificationSound = useCallback(() => {
    const ctx = initAudioContext();
    if (ctx.state === 'suspended') ctx.resume();
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(880, ctx.currentTime);
    gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.5);
  }, []);

  const sendNotification = useCallback((title: string, body: string) => {
    if (notificationPermission === 'granted') {
      new Notification(title, { body, icon: '/favicon.ico' });
      playNotificationSound();
    }
  }, [notificationPermission, playNotificationSound]);

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
      sendNotification('Sweat Smart Alert', 'High sweat risk detected based on climate and body signals.');
    } else if (isEnvTrigger) {
      setAlertStatus("Moderate Risk: Climate conditions may trigger sweating.");
    } else {
      setAlertStatus("Conditions Optimal: Low sweat risk detected.");
    }
  }, [weatherData, physiologicalData, thresholds, sendNotification, arePermissionsGranted]);

  // Logging logic
  const updateNextLogTime = useCallback(() => {
    const lastLog = logs.length > 0 ? logs[logs.length - 1].timestamp : 0;
    const startTime = lastLog > 0 ? lastLog : Date.now();
    setNextLogTime(startTime + LOG_INTERVAL);
  }, [logs]);

  useEffect(() => {
    updateNextLogTime();
    const interval = setInterval(() => {
      if (nextLogTime && Date.now() >= nextLogTime && arePermissionsGranted) {
        sendNotification('Time to Log', 'Please record your sweat level for the last 4 hours.');
        setIsLoggingModalOpen(true);
      }
    }, LOG_CHECK_INTERVAL);

    return () => clearInterval(interval);
  }, [logs, nextLogTime, sendNotification, updateNextLogTime, arePermissionsGranted]);

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
      <div className="max-w-7xl mx-auto space-y-6 animate-fade-in bg-gray-900 text-white p-6 rounded-xl">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-cyan-400">Sweat Smart Climate Alerts</h1>
            <p className="text-gray-400 mt-1">Real-time weather monitoring and personalized alerts</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate('/climate/history')}>
              <History className="h-4 w-4 mr-2" />
              History
            </Button>
            <Button variant="outline" onClick={() => navigate('/climate/settings')}>
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

          <button
            onClick={() => setPhysiologicalData({ eda: physiologicalData.eda + 5 })}
            className="w-full py-3 bg-purple-600 hover:bg-purple-500 rounded-lg transition-colors font-semibold"
          >
            Simulate EDA Spike
          </button>

          <SettingsPanel thresholds={thresholds} onThresholdChange={handleThresholdChange} />

          <LoggingSystem
            logs={logs}
            isModalOpen={isLoggingModalOpen}
            onCloseModal={() => setIsLoggingModalOpen(false)}
            onSubmitLog={handleLogSubmit}
            onLogNow={() => setIsLoggingModalOpen(true)}
            nextLogTime={nextLogTime}
          />
        </div>
      </div>
    </AppLayout>
  );
};

export default ClimateMonitor;
