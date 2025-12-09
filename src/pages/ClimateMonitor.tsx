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
const LOG_INTERVAL = 4 * 60 * 60 * 1000;
const WEATHER_REFRESH_INTERVAL = 5 * 60 * 1000; // 5 minutes
const LOG_CHECK_INTERVAL = 60000;
const EDA_STALE_TIME = 5 * 60 * 1000; // 5 minutes

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
  edaFreshness: 'fresh' | 'stale' | 'estimated';
  onRefreshWeather: () => void;
  onQuickScan: () => void;
}> = ({ weather, physiological, alertStatus, isFetching, weatherError, edaFreshness, onRefreshWeather, onQuickScan }) => {
  const statusColor = useMemo(() => {
    if (alertStatus.includes("High Risk")) return "text-red-400";
    if (alertStatus.includes("Moderate Risk")) return "text-yellow-400";
    return "text-green-400";
  }, [alertStatus]);

  const isAlertActive = alertStatus.includes("High Risk") || alertStatus.includes("Moderate Risk");

  const edaBadgeColor = edaFreshness === 'fresh' ? 'bg-green-500/20 text-green-400' : 
                        edaFreshness === 'stale' ? 'bg-yellow-500/20 text-yellow-400' : 
                        'bg-blue-500/20 text-blue-400';

  return (
    <div className={`relative bg-gray-800/50 border rounded-xl p-6 space-y-4 ${
      isAlertActive ? 'border-red-500 animate-pulse' : 'border-gray-700'
    }`}>
      {(isFetching || weatherError) && (
        <div className="absolute inset-0 bg-gray-800/90 flex flex-col items-center justify-center rounded-xl z-10">
          {isFetching && <p className="text-white font-semibold animate-pulse">Fetching local weather...</p>}
          {weatherError && <p className="text-red-400 font-semibold">{weatherError}</p>}
        </div>
      )}
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-bold text-cyan-300">Current Status</h3>
        <button
          onClick={onRefreshWeather}
          disabled={isFetching}
          className="p-2 rounded-lg bg-gray-700 hover:bg-gray-600 transition disabled:opacity-50"
          title="Refresh weather"
        >
          <RefreshIcon className={`w-5 h-5 text-cyan-400 ${isFetching ? 'animate-spin' : ''}`} />
        </button>
      </div>
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
        <div className="bg-gray-900 p-4 rounded-lg text-center relative">
          <ZapIcon className="w-8 h-8 mx-auto text-purple-400 mb-2" />
          <p className="text-2xl font-bold">{physiological.eda.toFixed(1)} µS</p>
          <p className="text-xs text-gray-400">EDA</p>
          <span className={`absolute top-2 right-2 text-[10px] px-2 py-0.5 rounded-full font-bold ${edaBadgeColor}`}>
            {edaFreshness === 'fresh' ? '✓ Fresh' : edaFreshness === 'stale' ? '⚠ Stale' : '≈ Est.'}
          </span>
        </div>
      </div>
      <div className={`bg-gray-900 p-4 rounded-lg text-center ${statusColor}`}>
        <p className="text-lg font-semibold">{alertStatus}</p>
      </div>
      {isAlertActive && edaFreshness !== 'fresh' && (
        <button
          onClick={onQuickScan}
          className="w-full py-3 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-lg transition flex items-center justify-center gap-2"
        >
          <ZapIcon className="w-5 h-5" />
          Quick Palm Scan for Accurate EDA
        </button>
      )}
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
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [physiologicalData, setPhysiologicalData] = useState<PhysiologicalData>({ eda: 2.5 });
  const [edaTimestamp, setEdaTimestamp] = useState<number>(Date.now());
  const [edaSource, setEdaSource] = useState<'palm-scanner' | 'estimated'>('estimated');

  const [thresholds, setThresholds] = useState<Thresholds>(() => {
    try {
      const saved = localStorage.getItem('sweatSmartThresholds');
      return saved ? JSON.parse(saved) : { temperature: 27, humidity: 75, uvIndex: 6 };
    } catch {
      return { temperature: 27, humidity: 75, uvIndex: 6 };
    }
  });

  const [logs, setLogs] = useState<LogEntry[]>(() => {
    try {
      const saved = localStorage.getItem('sweatSmartLogs');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [isLoggingModalOpen, setIsLoggingModalOpen] = useState(false);
  const [nextLogTime, setNextLogTime] = useState<number | null>(null);
  const [alertStatus, setAlertStatus] = useState("Complete setup to begin.");
  const [previousAlertStatus, setPreviousAlertStatus] = useState<string>("");

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

  // Load cached location on mount
  useEffect(() => {
    const cachedLocation = localStorage.getItem('cachedLocation');
    if (cachedLocation) {
      const coords = JSON.parse(cachedLocation);
      setLocation(coords);
      console.log('✅ Loaded cached location:', coords);
    }
  }, []);

  // Load EDA from Palm Scanner on mount
  useEffect(() => {
    const storedEDA = edaManager.getEDA();
    if (storedEDA && edaManager.isFresh()) {
      setPhysiologicalData({ eda: storedEDA.value });
      setEdaTimestamp(new Date(storedEDA.timestamp).getTime());
      setEdaSource('palm-scanner');
      console.log('✅ Loaded fresh EDA from Palm Scanner:', storedEDA);
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
        setWeatherError(null);
        console.log('✅ Real weather data fetched:', data);
      }
    } catch (error) {
      console.error("❌ Error fetching weather:", error);
      setWeatherError("Could not fetch weather data.");
    } finally {
      setIsFetchingWeather(false);
    }
  }, []);

  // Initial weather fetch
  useEffect(() => {
    if (location) {
      fetchWeatherData(location);
    }
  }, [location, fetchWeatherData]);

  // Periodic weather refresh every 5 minutes
  useEffect(() => {
    if (!location || !arePermissionsGranted) return;

    const interval = setInterval(() => {
      console.log('🔄 Auto-refreshing weather data...');
      fetchWeatherData(location);
    }, WEATHER_REFRESH_INTERVAL);

    return () => clearInterval(interval);
  }, [location, arePermissionsGranted, fetchWeatherData]);

  // Manual refresh handler
  const handleRefreshWeather = useCallback(() => {
    if (location) {
      console.log('🔄 Manual weather refresh triggered');
      fetchWeatherData(location);
    }
  }, [location, fetchWeatherData]);

  // Auto-estimate EDA based on climate conditions
  useEffect(() => {
    if (!weatherData || edaSource === 'palm-scanner') return;

    const interval = setInterval(() => {
      const temp = weatherData.temperature;
      const humidity = weatherData.humidity;
      
      // Estimate EDA based on climate severity
      let estimatedEDA = 2.0; // baseline
      
      if (temp > 30) estimatedEDA += (temp - 30) * 0.3;
      if (humidity > 70) estimatedEDA += (humidity - 70) * 0.05;
      if (weatherData.uvIndex > 7) estimatedEDA += (weatherData.uvIndex - 7) * 0.2;
      
      // Add some variation
      estimatedEDA += (Math.random() - 0.5) * 0.3;
      estimatedEDA = Math.max(1.5, Math.min(8, estimatedEDA));
      
      setPhysiologicalData({ eda: estimatedEDA });
    }, 10000); // Update every 10 seconds

    return () => clearInterval(interval);
  }, [weatherData, edaSource]);

  // Sound using shared SoundManager
  const playAlertSound = useCallback(
    (severity: 'CRITICAL' | 'WARNING' | 'REMINDER' = 'WARNING') => {
      soundManager.triggerMedicalAlert(severity);
    },
    []
  );

  const sendNotification = useCallback(
    async (title: string, body: string, severity: 'CRITICAL' | 'WARNING' | 'REMINDER' = 'WARNING') => {
      // Always attempt to play sound, even if system notifications are blocked
      playAlertSound(severity);

      if (notificationPermission === 'granted') {
        try {
          // Use Service Worker API for PWA compatibility
          if ('serviceWorker' in navigator) {
            const registration = await navigator.serviceWorker.ready;
            await registration.showNotification(title, { 
              body, 
              icon: '/favicon.ico',
              badge: '/favicon.ico'
            });
          }
        } catch (error) {
          console.error('Notification error:', error);
        }
      }
    },
    [notificationPermission, playAlertSound]
  );

  // Enhanced alert logic - Climate-focused with extreme conditions
  useEffect(() => {
    if (!arePermissionsGranted || !weatherData) {
      setAlertStatus("Complete setup to begin.");
      return;
    }

    const settings = localStorage.getItem('climateAppSettings');
    const soundEnabled = settings ? JSON.parse(settings).soundAlerts !== false : true;

    // Nighttime-aware risk model using USER'S CUSTOM thresholds
    const isNight = weatherData.uvIndex === 0;

    // Use USER'S custom thresholds from settings
    const tempThreshold = thresholds.temperature;
    const humidityThreshold = thresholds.humidity;
    const uvThreshold = thresholds.uvIndex;

    console.log(`🎯 Current thresholds - Temp: ${tempThreshold}°C, Humidity: ${humidityThreshold}%, UV: ${uvThreshold}`);
    console.log(`📊 Current conditions - Temp: ${weatherData.temperature}°C, Humidity: ${weatherData.humidity}%, UV: ${weatherData.uvIndex}`);

    // Extreme Risk: exceeds user threshold + buffer
    const isExtremeHeat = weatherData.temperature > tempThreshold + 2;
    const isExtremeUV = !isNight && weatherData.uvIndex > uvThreshold + 2;
    const isExtremeHumidity = !isNight && weatherData.humidity > humidityThreshold + 10;
    
    // Moderate Risk: between user threshold and extreme
    const isModerateHeat = weatherData.temperature > tempThreshold && weatherData.temperature <= tempThreshold + 2;
    const isModerateUV = !isNight && weatherData.uvIndex > uvThreshold && weatherData.uvIndex <= uvThreshold + 2;
    const isModerateHumidity = !isNight && weatherData.humidity > humidityThreshold && weatherData.humidity <= humidityThreshold + 10;

    let newStatus = "";
    const triggeredConditions = [];
    
    if (isExtremeHeat || isExtremeUV || isExtremeHumidity) {
      if (isExtremeHeat) triggeredConditions.push(`Temp ${weatherData.temperature}°C > ${tempThreshold + 2}°C`);
      if (isExtremeUV) triggeredConditions.push(`UV ${weatherData.uvIndex} > ${uvThreshold + 2}`);
      if (isExtremeHumidity) triggeredConditions.push(`Humidity ${weatherData.humidity}% > ${humidityThreshold + 10}%`);
      newStatus = "High Risk: Extreme climate conditions detected!";
      console.log(`🔴 HIGH RISK triggered by: ${triggeredConditions.join(', ')}`);
    } else if (isModerateHeat || isModerateUV || isModerateHumidity) {
      if (isModerateHeat) triggeredConditions.push(`Temp ${weatherData.temperature}°C > ${tempThreshold}°C`);
      if (isModerateUV) triggeredConditions.push(`UV ${weatherData.uvIndex} > ${uvThreshold}`);
      if (isModerateHumidity) triggeredConditions.push(`Humidity ${weatherData.humidity}% > ${humidityThreshold}%`);
      newStatus = "Moderate Risk: Climate conditions may trigger sweating.";
      console.log(`🟡 MODERATE RISK triggered by: ${triggeredConditions.join(', ')}`);
    } else {
      newStatus = "Conditions Optimal: Low sweat risk detected.";
      console.log(`✅ All conditions below thresholds - No alert needed`);
    }

    // Only send notification if status CHANGED
    if (newStatus !== previousAlertStatus) {
      console.log(`🚨 Alert status changed: "${previousAlertStatus}" → "${newStatus}"`);
      
      setAlertStatus(newStatus);
      setPreviousAlertStatus(newStatus);

      if (soundEnabled) {
        if (newStatus.includes("High Risk")) {
          console.log('🔴 HIGH RISK ALERT - Playing critical sound');
          sendNotification(
            'Sweat Smart Alert',
            'Extreme climate conditions detected! High sweat risk.',
            'CRITICAL'
          );
        } else if (newStatus.includes("Moderate Risk")) {
          console.log('🟡 MODERATE RISK ALERT - Playing warning sound');
          sendNotification(
            'Sweat Smart Alert',
            'Moderate sweat risk detected. Consider logging your episode.',
            'WARNING'
          );
        }
      }
    }
  }, [weatherData, thresholds, sendNotification, arePermissionsGranted, previousAlertStatus]);

  // Logging logic with fixed 4-hour schedule (00:00, 04:00, 08:00, 12:00, 16:00, 20:00)
  const updateNextLogTime = useCallback(() => {
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    
    console.log(`⏰ Calculating next log time. Current: ${currentHour}:${String(currentMinute).padStart(2, '0')}`);
    
    // Fixed 4-hour blocks
    const blocks = [0, 4, 8, 12, 16, 20];
    
    // Find the next block
    let nextBlockHour = blocks.find(block => block > currentHour);
    
    // If no block found today, use first block of tomorrow
    const next = new Date(now);
    if (nextBlockHour === undefined) {
      next.setDate(next.getDate() + 1);
      nextBlockHour = 0;
    }
    
    next.setHours(nextBlockHour, 0, 0, 0);

    const nextTime = next.getTime();
    const timeUntil = Math.round((nextTime - now.getTime()) / (1000 * 60));
    const hours = Math.floor(timeUntil / 60);
    const minutes = timeUntil % 60;
    
    console.log(`⏰ Next log: ${nextBlockHour}:00 (in ${hours}h ${minutes}m)`);
    
    setNextLogTime(nextTime);
    localStorage.setItem('climateNextLogTime', nextTime.toString());
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

  useEffect(() => {
    const interval = setInterval(async () => {
      if (nextLogTime && Date.now() >= nextLogTime && arePermissionsGranted) {
        console.log('⏰ 4-HOUR LOG REMINDER - Time to log!');
        // Professional reminder sound for compulsory logging
        playAlertSound('REMINDER');

        if (notificationPermission === 'granted') {
          try {
            if ('serviceWorker' in navigator) {
              const registration = await navigator.serviceWorker.ready;
              await registration.showNotification('Time to Log', {
                body: 'Please record your sweat level for the last 4 hours.',
                icon: '/favicon.ico',
                badge: '/favicon.ico',
                requireInteraction: true
              });
            }
          } catch (error) {
            console.error('4-hour notification error:', error);
          }
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
    const finalPermission = permission === 'default' ? 'prompt' : permission;
    setNotificationPermission(finalPermission);
    
    // Test sound immediately after permission granted
    if (finalPermission === 'granted') {
      console.log('✅ Notification permission granted - playing test sound');
      playAlertSound('REMINDER');
      try {
        if ('serviceWorker' in navigator) {
          const registration = await navigator.serviceWorker.ready;
          await registration.showNotification('Sweat Smart Alert Enabled!', {
            body: 'You will now receive sound and notification alerts. 🔔',
            icon: '/favicon.ico',
            badge: '/favicon.ico'
          });
        }
      } catch (error) {
        console.error('Permission granted notification error:', error);
      }
    }
  };

  const handleRequestLocation = () => {
    console.log('📍 Requesting location permission...');
    navigator.geolocation.getCurrentPosition(
      (position) => {
        console.log('✅ Location permission granted:', position.coords);
        setLocation(position.coords);
        setLocationPermission('granted');
        // After location granted, automatically request notification
        if (notificationPermission === 'prompt') {
          setTimeout(() => requestNotificationPermission(), 500);
        }
      },
      (error) => {
        console.error("❌ Geolocation error:", error);
        if (error.code === error.PERMISSION_DENIED) {
          setLocationPermission('denied');
        }
      }
    );
  };

  // Auto-request permissions - improved version
  useEffect(() => {
    const autoRequestPermissions = () => {
      // Only auto-request if we're in 'prompt' state (not denied or granted)
      if (locationPermission === 'prompt' && !location) {
        console.log('🚀 Auto-requesting permissions...');
        handleRequestLocation();
      }
    };

    // Delay auto-request slightly to ensure page is fully loaded
    const timer = setTimeout(() => {
      autoRequestPermissions();
    }, 1000);

    return () => clearTimeout(timer);
  }, [locationPermission, location]);

  const handleThresholdChange = (key: keyof Thresholds, value: number) => {
    setThresholds(prev => ({ ...prev, [key]: value }));
  };

  const handleLogSubmit = (level: HDSSLevel) => {
    const newLog: LogEntry = {
      id: new Date().toISOString(),
      timestamp: Date.now(),
      hdssLevel: level,
      weather: weatherData || { temperature: 0, humidity: 0, uvIndex: 0 },
      physiologicalData: physiologicalData
    };
    setLogs(prev => [...prev, newLog]);
    setIsLoggingModalOpen(false);
  };

  const handleTestAlert = () => {
    sendNotification(
      'Test Alert',
      'This is a test notification with sound.',
      'WARNING'
    );
  };

  const handleQuickScan = () => {
    navigate('/palm-scanner');
  };

  // Calculate EDA freshness
  const edaFreshness = useMemo<'fresh' | 'stale' | 'estimated'>(() => {
    if (edaSource === 'estimated') return 'estimated';
    const age = Date.now() - edaTimestamp;
    return age < EDA_STALE_TIME ? 'fresh' : 'stale';
  }, [edaTimestamp, edaSource]);

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto space-y-6 animate-fade-in bg-black text-white p-6 rounded-xl min-h-screen">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-cyan-400">Sweat Smart Climate Alerts</h1>
            <p className="text-gray-400 mt-1">Real-time weather monitoring and personalized alerts</p>
          </div>
          <div className="flex gap-2">
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

        {/* Permissions Wizard - Sticky at top */}
        {!arePermissionsGranted && (
          <div className="sticky top-0 z-50 mb-6">
            <PermissionsWizard
              locationStatus={locationPermission}
              notificationStatus={notificationPermission}
              onRequestLocation={handleRequestLocation}
              onRequestNotification={requestNotificationPermission}
              onCheckPermissions={checkPermissions}
            />
          </div>
        )}

        {/* Main Content */}
        <div className={`space-y-6 transition-opacity duration-500 ${arePermissionsGranted ? 'opacity-100' : 'opacity-40 blur-sm pointer-events-none'}`}>
          <CurrentStatusCard 
            weather={weatherData || { temperature: 0, humidity: 0, uvIndex: 0 }} 
            physiological={physiologicalData} 
            alertStatus={alertStatus}
            isFetching={isFetchingWeather}
            weatherError={weatherError}
            edaFreshness={edaFreshness}
            onRefreshWeather={handleRefreshWeather}
            onQuickScan={handleQuickScan}
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
              onClick={() => navigate('/palm-scanner?returnTo=/climate')}
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

          {/* Test Alert Button */}
          <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-cyan-300">Test Alerts</p>
                <p className="text-xs text-gray-400">Verify sound and notifications are working</p>
              </div>
              <Button
                onClick={async () => {
                  console.log('🧪 TEST ALERT button clicked');
                  playAlertSound('WARNING');
                  if (notificationPermission === 'granted') {
                    try {
                      if ('serviceWorker' in navigator) {
                        const registration = await navigator.serviceWorker.ready;
                        await registration.showNotification('Test Alert', {
                          body: 'Your alerts are working correctly! 🎉',
                          icon: '/favicon.ico',
                          badge: '/favicon.ico'
                        });
                      }
                      console.log('✅ Test notification sent');
                    } catch (error) {
                      console.error('Test notification error:', error);
                    }
                  } else {
                    console.log('❌ Notification permission not granted:', notificationPermission);
                  }
                }}
                className="bg-cyan-600 hover:bg-cyan-500 text-white"
              >
                Test Alert
              </Button>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default ClimateMonitor;
