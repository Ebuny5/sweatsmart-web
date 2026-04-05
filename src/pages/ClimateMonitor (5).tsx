import React, { useState, useEffect, useCallback, useMemo } from 'react';
import AppLayout from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { LoggingSystem } from "../components/climate/LoggingSystem";
import { SettingsPanel } from "../components/climate/SettingsPanel";
import { WebPushSettings } from "../components/climate/WebPushSettings";
import { useNavigate } from "react-router-dom";
import { supabase } from '@/integrations/supabase/client';
import { edaManager } from '@/utils/edaManager';
import type { WeatherData, PhysiologicalData, Thresholds, LogEntry, HDSSLevel } from "@/types";
import { soundManager } from '@/utils/soundManager';
import { calculateSweatRisk, getRiskSeverity, type SweatRiskLevel } from '@/utils/sweatRiskCalculator';

// Icons
const ThermometerIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg {...props} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);
const DropletIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg {...props} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
  </svg>
);
const SunIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg {...props} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h1M3 12H2m15.364 6.364l-.707.707M6.343 6.343l-.707-.707m12.728 0l-.707-.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
  </svg>
);
const ZapIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg {...props} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
  </svg>
);
const BellIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg {...props} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
  </svg>
);
const MapPinIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg {...props} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);
const RefreshIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg {...props} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356-2A8.001 8.001 0 004 12c0 2.127.766 4.047 2.031 5.488M16 20v-5h.582m-15.356 2A8.001 8.001 0 0020 12c0-2.127-.766-4.047-2.031-5.488" />
  </svg>
);

const TESTING_MODE = false;
const LOG_CHECK_INTERVAL = 30000;
const WEATHER_REFRESH_INTERVAL = 15 * 60 * 1000;

type PermissionStatus = 'prompt' | 'granted' | 'denied';

// ─── Card wrapper — glass effect on purple/pink gradient ───────────────────
const Card: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <div className={`bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-5 ${className}`}>
    {children}
  </div>
);

// ─── Permissions Wizard ────────────────────────────────────────────────────
const PermissionsWizard: React.FC<{
  locationStatus: PermissionStatus;
  notificationStatus: PermissionStatus;
  onRequestLocation: () => void;
  onRequestNotification: () => void;
  onCheckPermissions: () => void;
}> = ({ locationStatus, notificationStatus, onRequestLocation, onRequestNotification, onCheckPermissions }) => {
  const isBlocked = locationStatus === 'denied' || notificationStatus === 'denied';
  return (
    <Card>
      <h3 className="text-xl font-bold text-white mb-1">Setup Required</h3>
      <p className="text-white/70 text-sm mb-4">SweatSmart needs location and notification permissions for real-time alerts.</p>
      <div className="space-y-3">
        <div className="flex items-center justify-between bg-white/10 p-4 rounded-xl">
          <div className="flex items-center space-x-3">
            <MapPinIcon className={`w-5 h-5 ${locationStatus === 'granted' ? 'text-green-300' : 'text-white'}`} />
            <span className="font-semibold text-white text-sm">Local Weather</span>
          </div>
          {locationStatus === 'granted' && <span className="text-xs font-bold text-green-300">✓ Enabled</span>}
          {locationStatus === 'prompt' && (
            <button onClick={onRequestLocation} className="bg-white text-purple-700 text-xs font-bold px-4 py-2 rounded-lg hover:bg-white/90 transition">
              Enable
            </button>
          )}
          {locationStatus === 'denied' && <span className="text-xs font-bold text-red-300">Blocked</span>}
        </div>
        <div className="flex items-center justify-between bg-white/10 p-4 rounded-xl">
          <div className="flex items-center space-x-3">
            <BellIcon className={`w-5 h-5 ${notificationStatus === 'granted' ? 'text-green-300' : 'text-white'}`} />
            <span className="font-semibold text-white text-sm">Climate Alerts</span>
          </div>
          {notificationStatus === 'granted' && <span className="text-xs font-bold text-green-300">✓ Enabled</span>}
          {notificationStatus === 'prompt' && (
            <button onClick={onRequestNotification} disabled={locationStatus !== 'granted'}
              className="bg-white text-purple-700 text-xs font-bold px-4 py-2 rounded-lg hover:bg-white/90 transition disabled:opacity-40">
              Enable
            </button>
          )}
          {notificationStatus === 'denied' && <span className="text-xs font-bold text-red-300">Blocked</span>}
        </div>
      </div>
      {isBlocked && (
        <div className="mt-4 bg-red-500/20 border border-red-400/40 p-4 rounded-xl">
          <p className="text-sm text-white mb-3">Permissions blocked. Please update them in your browser site settings.</p>
          <button onClick={onCheckPermissions} className="flex items-center gap-2 bg-white text-purple-700 font-bold px-4 py-2 rounded-lg hover:bg-white/90 transition text-sm">
            <RefreshIcon className="w-4 h-4" /> Check Again
          </button>
        </div>
      )}
    </Card>
  );
};

// ─── Weather Error Card ────────────────────────────────────────────────────
const WeatherErrorCard: React.FC<{ error: string; onRetry: () => void; isFetching: boolean }> = ({ error, onRetry, isFetching }) => (
  <Card>
    <div className="text-center space-y-3">
      <p className="text-white font-semibold">⚠️ Could not fetch real weather data</p>
      <p className="text-white/70 text-sm">{error}</p>
      <p className="text-white/50 text-xs">No alerts will fire until real data is available.</p>
      <button onClick={onRetry} disabled={isFetching}
        className="inline-flex items-center gap-2 bg-white text-purple-700 font-bold px-5 py-2 rounded-lg hover:bg-white/90 transition disabled:opacity-50">
        <RefreshIcon className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
        {isFetching ? 'Retrying...' : 'Retry'}
      </button>
    </div>
  </Card>
);

// ─── Current Status Card ───────────────────────────────────────────────────
const CurrentStatusCard: React.FC<{
  weather: WeatherData;
  physiological: PhysiologicalData;
  alertStatus: string;
  isFetching: boolean;
  edaIsWearableAndFresh: boolean;
}> = ({ weather, physiological, alertStatus, isFetching, edaIsWearableAndFresh }) => {

  // Status pill colours — all readable on purple/pink
  const statusStyle = useMemo(() => {
    if (alertStatus.includes("Extreme Risk")) return { bg: 'bg-red-500/90', text: 'text-white' };
    if (alertStatus.includes("High Risk"))    return { bg: 'bg-red-400/80',  text: 'text-white' };
    if (alertStatus.includes("Moderate Risk"))return { bg: 'bg-orange-400/80', text: 'text-white' };
    if (alertStatus.includes("Low Risk"))     return { bg: 'bg-sky-400/80',  text: 'text-white' };
    return { bg: 'bg-green-400/80', text: 'text-white' };
  }, [alertStatus]);

  const getLastUpdatedText = () => {
    if (!weather.lastUpdated) return null;
    const diff = Math.floor((Date.now() - weather.lastUpdated) / 1000);
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    return `${Math.floor(diff / 3600)}h ago`;
  };

  const displayUV = Math.min(11, weather.uvIndex);

  return (
    <Card className="relative">
      {isFetching && (
        <div className="absolute inset-0 bg-purple-900/80 flex items-center justify-center rounded-2xl z-10">
          <p className="text-white font-semibold animate-pulse">Fetching weather data...</p>
        </div>
      )}

      {/* Header row */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-white">Current Status</h3>
        <div className="flex items-center gap-2">
          {weather.location && <span className="text-xs text-white/80 font-medium">{weather.location}</span>}
          {weather.lastUpdated && (
            <span className="text-xs text-white/60 bg-white/10 px-2 py-1 rounded-lg">🔄 {getLastUpdatedText()}</span>
          )}
          <span className="text-xs text-green-300 bg-green-400/20 px-2 py-1 rounded-lg font-semibold">✅ Real</span>
        </div>
      </div>

      {/* Weather metrics grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <div className="bg-white/10 p-4 rounded-xl text-center">
          <ThermometerIcon className="w-7 h-7 mx-auto text-orange-300 mb-2" />
          <p className="text-xl font-bold text-white">{weather.temperature.toFixed(1)}°C</p>
          <p className="text-xs text-white/60 mt-1">Temperature</p>
        </div>
        <div className="bg-white/10 p-4 rounded-xl text-center">
          <DropletIcon className="w-7 h-7 mx-auto text-sky-300 mb-2" />
          <p className="text-xl font-bold text-white">{weather.humidity.toFixed(0)}%</p>
          <p className="text-xs text-white/60 mt-1">Humidity</p>
        </div>
        <div className="bg-white/10 p-4 rounded-xl text-center">
          <SunIcon className="w-7 h-7 mx-auto text-yellow-300 mb-2" />
          <p className="text-xl font-bold text-white">{displayUV.toFixed(1)}</p>
          <p className="text-xs text-white/60 mt-1">UV Index</p>
        </div>
        <div className="bg-white/10 p-4 rounded-xl text-center">
          <ZapIcon className="w-7 h-7 mx-auto text-pink-300 mb-2" />
          <p className="text-xl font-bold text-white">{physiological.eda.toFixed(1)} µS</p>
          <p className="text-xs text-white/60 mt-1">EDA</p>
        </div>
      </div>

      {/* EDA stale notice */}
      {!edaIsWearableAndFresh && (
        <div className="bg-white/10 border border-white/20 rounded-xl px-4 py-2 text-center mb-3">
          <p className="text-xs text-white/80">⚠️ EDA stale or simulated — climate data only used for alert severity</p>
        </div>
      )}

      {weather.description && (
        <p className="text-center text-sm text-white/70 capitalize mb-3">{weather.description}</p>
      )}

      {/* Alert status pill */}
      <div className={`${statusStyle.bg} rounded-xl p-4 text-center`}>
        <p className={`text-base font-bold ${statusStyle.text}`}>{alertStatus}</p>
      </div>
    </Card>
  );
};

// ─── Diagnostics Panel ─────────────────────────────────────────────────────
const DiagnosticsPanel: React.FC<{
  locationPermission: PermissionStatus;
  notificationPermission: PermissionStatus;
  lastLogTime: number | null;
  nextLogTime: number | null;
  lastWeatherFetch: number | null;
  edaIsWearableAndFresh: boolean;
}> = ({ locationPermission, notificationPermission, lastLogTime, nextLogTime, lastWeatherFetch, edaIsWearableAndFresh }) => {
  const fmt = (ts: number | null) =>
    ts ? new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—';
  return (
    <Card>
      <p className="text-xs font-bold text-white/60 uppercase tracking-widest mb-3">Diagnostics</p>
      <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
        <span className="text-white/60">Location permission</span>
        <span className={locationPermission === 'granted' ? 'text-green-300 font-semibold' : 'text-red-300 font-semibold'}>{locationPermission}</span>
        <span className="text-white/60">Notification permission</span>
        <span className={notificationPermission === 'granted' ? 'text-green-300 font-semibold' : 'text-red-300 font-semibold'}>{notificationPermission}</span>
        <span className="text-white/60">Last log time</span>
        <span className="text-white font-medium">{fmt(lastLogTime)}</span>
        <span className="text-white/60">Next log time</span>
        <span className="text-white font-medium">{fmt(nextLogTime)}</span>
        <span className="text-white/60">Last weather fetch</span>
        <span className="text-white font-medium">{fmt(lastWeatherFetch)}</span>
        <span className="text-white/60">EDA source</span>
        <span className={edaIsWearableAndFresh ? 'text-green-300 font-semibold' : 'text-orange-300 font-semibold'}>
          {edaIsWearableAndFresh ? 'Wearable (fresh)' : 'Simulated / stale'}
        </span>
      </div>
    </Card>
  );
};

// ─── Main Component ────────────────────────────────────────────────────────
const ClimateMonitor = () => {
  const navigate = useNavigate();
  const [notificationPermission, setNotificationPermission] = useState<PermissionStatus>('prompt');
  const [locationPermission, setLocationPermission] = useState<PermissionStatus>('prompt');
  const [location, setLocation] = useState<GeolocationCoordinates | null>(null);
  const [isFetchingWeather, setIsFetchingWeather] = useState(false);
  const [weatherError, setWeatherError] = useState<string | null>(null);
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [lastWeatherFetch, setLastWeatherFetch] = useState<number | null>(null);
  const [physiologicalData, setPhysiologicalData] = useState<PhysiologicalData>({ eda: 2.5 });
  const [thresholds, setThresholds] = useState<Thresholds>(() => {
    const saved = localStorage.getItem('sweatSmartThresholds');
    return saved ? JSON.parse(saved) : { temperature: 28, humidity: 70, uvIndex: 6 };
  });
  const [logs, setLogs] = useState<LogEntry[]>(() => {
    const saved = localStorage.getItem('sweatSmartLogs');
    return saved ? JSON.parse(saved) : [];
  });
  const [isLoggingModalOpen, setIsLoggingModalOpen] = useState(false);
  const [nextLogTime, setNextLogTime] = useState<number | null>(null);
  const [alertStatus, setAlertStatus] = useState("Waiting for real weather data...");
  const [lastAlertType, setLastAlertType] = useState<string | null>(() =>
    localStorage.getItem('climateLastAlertType')
  );
  const [lastLogTime, setLastLogTime] = useState<number | null>(() => {
    const s = localStorage.getItem('climateLastLogTime');
    return s ? parseInt(s, 10) : null;
  });

  const edaIsWearableAndFresh = edaManager.isWearableAndFresh();
  const arePermissionsGranted = locationPermission === 'granted' && notificationPermission === 'granted';
  const hasRealWeather = weatherData !== null && !weatherError;

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
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => { setLocation(position.coords); setLocationPermission('granted'); },
        (error) => { if (error.code === error.PERMISSION_DENIED) setLocationPermission('denied'); },
        { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 }
      );
    }
  }, [checkPermissions]);

  useEffect(() => {
    const storedEDA = edaManager.getEDA();
    if (storedEDA && edaManager.isFresh()) {
      setPhysiologicalData({ eda: storedEDA.value });
    }
  }, []);

  useEffect(() => { localStorage.setItem('sweatSmartThresholds', JSON.stringify(thresholds)); }, [thresholds]);
  useEffect(() => { localStorage.setItem('sweatSmartLogs', JSON.stringify(logs)); }, [logs]);

  const fetchWeatherData = useCallback(async (coords: GeolocationCoordinates) => {
    setIsFetchingWeather(true);
    setWeatherError(null);
    try {
      const { data, error } = await supabase.functions.invoke('get-weather-data', {
        body: { latitude: coords.latitude, longitude: coords.longitude }
      });
      if (error) throw new Error(error.message);
      if (data.simulated) throw new Error(data.error || 'Weather API unavailable — no real data received.');
      const now = Date.now();
      setWeatherData({ ...data, uvIndex: Math.min(11, data.uvIndex ?? data.uvi ?? 0), lastUpdated: now });
      setLastWeatherFetch(now);
      setWeatherError(null);
    } catch (err: any) {
      console.error('🌤️ Weather fetch failed:', err);
      setWeatherError(err.message || 'Could not fetch weather data. Check your connection.');
    } finally {
      setIsFetchingWeather(false);
    }
  }, []);

  useEffect(() => {
    if (location) {
      fetchWeatherData(location);
      const interval = setInterval(() => fetchWeatherData(location), WEATHER_REFRESH_INTERVAL);
      return () => clearInterval(interval);
    }
  }, [location, fetchWeatherData]);

  useEffect(() => {
    const interval = setInterval(() => {
      setPhysiologicalData(prev => ({ eda: Math.max(0, prev.eda + (Math.random() - 0.45) * 0.5) }));
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const playAlertSound = useCallback(
    (severity: 'CRITICAL' | 'WARNING' | 'MODERATE' | 'LOW' | 'OPTIMAL' | 'REMINDER' = 'WARNING') => {
      soundManager.triggerMedicalAlert(severity);
    }, []
  );

  const sendNotification = useCallback(
    async (title: string, body: string, severity: 'CRITICAL' | 'WARNING' | 'MODERATE' | 'LOW' | 'OPTIMAL' | 'REMINDER' = 'WARNING') => {
      playAlertSound(severity);
      if ('serviceWorker' in navigator && notificationPermission === 'granted') {
        try {
          const registration = await navigator.serviceWorker.ready;
          await registration.showNotification(title, {
            body, icon: '/icon-192.png', badge: '/icon-192.png',
            tag: `sweatsmart-climate-${Date.now()}`,
            requireInteraction: severity === 'CRITICAL',
            vibrate: severity === 'CRITICAL' ? [800, 200, 800, 200, 800] : [400, 100, 400],
          } as NotificationOptions);
        } catch (err) { console.error('📱 Notification failed:', err); }
      }
    }, [notificationPermission, playAlertSound]
  );

  useEffect(() => {
    if (!arePermissionsGranted) { setAlertStatus("Complete setup to begin."); return; }
    if (!hasRealWeather || !weatherData) { setAlertStatus("Waiting for real weather data..."); return; }

    const settings = localStorage.getItem('climateAppSettings');
    const soundEnabled = settings ? JSON.parse(settings).soundAlerts !== false : true;
    const safeUV = Math.min(11, weatherData.uvIndex);
    const edaForRisk = edaIsWearableAndFresh ? physiologicalData.eda : 0;

    const risk = calculateSweatRisk(weatherData.temperature, weatherData.humidity, safeUV, edaForRisk, false);

    const riskToSeverity: Record<SweatRiskLevel, 'CRITICAL' | 'WARNING' | 'MODERATE' | 'LOW' | 'OPTIMAL'> = {
      safe: 'OPTIMAL', low: 'LOW', moderate: 'MODERATE', high: 'WARNING', extreme: 'CRITICAL',
    };
    const riskToAlertType: Record<SweatRiskLevel, string> = {
      safe: 'optimal', low: 'optimal', moderate: 'moderate', high: 'high', extreme: 'high',
    };

    const currentAlertType = riskToAlertType[risk.level];
    const currentSeverity = riskToSeverity[risk.level];

    if (risk.level === 'safe') setAlertStatus("Conditions Optimal: Comfortable conditions for hyperhidrosis management.");
    else if (risk.level === 'low') setAlertStatus("Low Risk: Mild conditions — stay hydrated and monitor.");
    else setAlertStatus(`${risk.message}: ${risk.description}`);

    if (soundEnabled && currentAlertType !== lastAlertType && currentAlertType !== 'optimal') {
      sendNotification(
        `SweatSmart Alert — ${risk.message}`,
        `Temp: ${weatherData.temperature.toFixed(1)}°C | Humidity: ${weatherData.humidity.toFixed(0)}% | UV: ${safeUV.toFixed(1)}`,
        currentSeverity
      );
    }

    localStorage.setItem('climateLastAlertType', currentAlertType);
    localStorage.setItem('climateLastAlertTimestamp', Date.now().toString());
    setLastAlertType(currentAlertType);
  }, [weatherData, physiologicalData, sendNotification, arePermissionsGranted, lastAlertType, hasRealWeather, edaIsWearableAndFresh]);

  const updateNextLogTime = useCallback((anchor?: number) => {
    const base = anchor ?? (parseInt(localStorage.getItem('climateLastLogTime') || '0', 10) || Date.now());
    const nextTime = base + 4 * 60 * 60 * 1000;
    setNextLogTime(nextTime);
    localStorage.setItem('climateNextLogTime', nextTime.toString());
  }, []);

  useEffect(() => {
    const stored = localStorage.getItem('climateNextLogTime');
    const storedTime = stored ? parseInt(stored, 10) : NaN;
    if (storedTime && storedTime > Date.now()) setNextLogTime(storedTime);
    else updateNextLogTime();
  }, [updateNextLogTime]);

  useEffect(() => {
    const handler = () => { if (arePermissionsGranted) setIsLoggingModalOpen(true); };
    window.addEventListener('sweatsmart-log-reminder', handler);
    return () => window.removeEventListener('sweatsmart-log-reminder', handler);
  }, [arePermissionsGranted]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (nextLogTime && Date.now() >= nextLogTime && arePermissionsGranted) {
        playAlertSound('REMINDER');
        if ('serviceWorker' in navigator && notificationPermission === 'granted') {
          navigator.serviceWorker.ready.then(reg => {
            reg.showNotification('⏰ Time to Log', {
              body: 'Please record your sweat level for the last 4 hours.',
              icon: '/icon-192.png', badge: '/icon-192.png', tag: 'log-reminder',
              requireInteraction: true, data: { url: '/climate' }
            } as NotificationOptions).catch(console.error);
          });
        }
        setIsLoggingModalOpen(true);
        updateNextLogTime();
      }
    }, LOG_CHECK_INTERVAL);
    return () => clearInterval(interval);
  }, [nextLogTime, arePermissionsGranted, playAlertSound, notificationPermission, updateNextLogTime]);

  const requestNotificationPermission = async () => {
    if (locationPermission !== 'granted') return;
    const permission = await Notification.requestPermission();
    setNotificationPermission(permission === 'default' ? 'prompt' : permission);
  };

  const handleRequestLocation = () => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation(position.coords); setLocationPermission('granted');
        if (notificationPermission === 'prompt') requestNotificationPermission();
      },
      (error) => { if (error.code === error.PERMISSION_DENIED) setLocationPermission('denied'); }
    );
  };

  const handleThresholdChange = (key: keyof Thresholds, value: number) => {
    setThresholds(prev => ({ ...prev, [key]: value }));
  };

  const handleLogSubmit = (level: HDSSLevel) => {
    const now = Date.now();
    const newLog: LogEntry = {
      id: new Date().toISOString(),
      timestamp: now,
      hdssLevel: level,
      weather: weatherData ?? { temperature: 0, humidity: 0, uvIndex: 0 },
      physiologicalData,
    };
    setLogs(prev => [...prev, newLog]);
    localStorage.setItem('climateLastLogTime', now.toString());
    setLastLogTime(now);
    updateNextLogTime(now);
    setIsLoggingModalOpen(false);
  };

  return (
    <AppLayout>
      {/* ── SweatSmart purple → pink gradient background ── */}
      <div className="min-h-full bg-gradient-to-br from-purple-600 via-fuchsia-500 to-pink-500 p-5 rounded-xl space-y-5">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white drop-shadow">SweatSmart Climate Alerts</h1>
            <p className="text-white/70 text-sm mt-0.5">Real-time weather monitoring and personalized alerts</p>
          </div>
          {location && (
            <button
              onClick={() => fetchWeatherData(location)}
              disabled={isFetchingWeather}
              className="flex items-center gap-2 bg-white/20 hover:bg-white/30 text-white text-sm font-semibold px-4 py-2 rounded-xl transition disabled:opacity-50"
            >
              <RefreshIcon className={`h-4 w-4 ${isFetchingWeather ? 'animate-spin' : ''}`} />
              {isFetchingWeather ? 'Refreshing...' : 'Refresh'}
            </button>
          )}
        </div>

        {/* Permissions wizard */}
        {!arePermissionsGranted && (
          <PermissionsWizard
            locationStatus={locationPermission} notificationStatus={notificationPermission}
            onRequestLocation={handleRequestLocation} onRequestNotification={requestNotificationPermission}
            onCheckPermissions={checkPermissions}
          />
        )}

        {/* Main content — blurred when permissions not granted */}
        <div className={`space-y-5 transition-all duration-500 ${arePermissionsGranted ? 'opacity-100' : 'opacity-40 blur-sm pointer-events-none'}`}>

          {weatherError && (
            <WeatherErrorCard error={weatherError} onRetry={() => location && fetchWeatherData(location)} isFetching={isFetchingWeather} />
          )}

          {hasRealWeather && weatherData && (
            <CurrentStatusCard
              weather={weatherData} physiological={physiologicalData}
              alertStatus={alertStatus} isFetching={isFetchingWeather}
              edaIsWearableAndFresh={edaIsWearableAndFresh}
            />
          )}

          {!weatherError && !hasRealWeather && arePermissionsGranted && (
            <Card>
              <p className="text-white font-semibold animate-pulse text-center">Fetching real weather data for your location...</p>
            </Card>
          )}

          {/* EDA section */}
          <Card>
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-sm text-white/60">Electrodermal Activity (EDA)</p>
                <p className="text-2xl font-bold text-white">{physiologicalData.eda.toFixed(1)} µS</p>
              </div>
              {(() => {
                const storedEDA = edaManager.getEDA();
                const isFresh = edaManager.isFresh();
                if (storedEDA && edaIsWearableAndFresh) return (
                  <span className="text-xs bg-green-400/30 text-green-200 px-3 py-1 rounded-full border border-green-400/40 font-semibold">
                    Fresh • {storedEDA.source}
                  </span>
                );
                if (storedEDA && isFresh && !edaIsWearableAndFresh) return (
                  <span className="text-xs bg-white/10 text-white/70 px-3 py-1 rounded-full border border-white/20">
                    Simulated — not used for alerts
                  </span>
                );
                if (storedEDA && !isFresh) return (
                  <span className="text-xs bg-white/10 text-white/70 px-3 py-1 rounded-full border border-white/20">
                    Stale • Generate new
                  </span>
                );
                return <span className="text-xs bg-white/10 text-white/50 px-3 py-1 rounded-full border border-white/20">No data</span>;
              })()}
            </div>
            <button
              onClick={() => {
                const eda = physiologicalData.eda;
                const mode = eda > 10 ? 'Trigger' : eda > 5 ? 'Active' : 'Resting';
                navigate(`/palm-scanner?returnTo=/climate&mode=${mode}`);
              }}
              className="w-full py-3 bg-white/20 hover:bg-white/30 text-white rounded-xl transition font-semibold flex items-center justify-center gap-2"
            >
              <ZapIcon className="w-5 h-5" /> Go to Palm Scanner
            </button>
          </Card>

          <SettingsPanel thresholds={thresholds} onThresholdChange={handleThresholdChange} />
          <WebPushSettings thresholds={thresholds} />
          <LoggingSystem
            logs={logs}
            isModalOpen={isLoggingModalOpen}
            onCloseModal={() => setIsLoggingModalOpen(false)}
            onSubmitLog={handleLogSubmit}
            onLogNow={() => navigate('/log-episode')}
            nextLogTime={nextLogTime}
            lastLogTime={lastLogTime}
          />

          <DiagnosticsPanel
            locationPermission={locationPermission}
            notificationPermission={notificationPermission}
            lastLogTime={lastLogTime}
            nextLogTime={nextLogTime}
            lastWeatherFetch={lastWeatherFetch}
            edaIsWearableAndFresh={edaIsWearableAndFresh}
          />

          {/* Testing & Debug */}
          <Card>
            <p className="text-sm font-bold text-white mb-3">Testing & Debug</p>
            <div className="flex flex-wrap gap-2 mb-3">
              <button
                onClick={async () => {
                  playAlertSound('WARNING');
                  const { enhancedMobileNotificationService } = await import('@/services/EnhancedMobileNotificationService');
                  await enhancedMobileNotificationService.showNotification('✅ Test Alert', 'Your alerts are working correctly! 🎉', 'success');
                  if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
                    navigator.serviceWorker.controller.postMessage({ type: 'TEST_NOTIFICATION' });
                  }
                }}
                className="bg-white/20 hover:bg-white/30 text-white text-sm font-semibold px-4 py-2 rounded-lg transition"
              >Test Alert</button>
              <button
                onClick={() => {
                  const testTime = Date.now() + 10000;
                  localStorage.setItem('climateNextLogTime', testTime.toString());
                  localStorage.removeItem('lastLogAlertTime');
                  setNextLogTime(testTime);
                  if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
                    navigator.serviceWorker.controller.postMessage({ type: 'SYNC_LOG_REMINDER', nextLogTime: testTime });
                  }
                  alert('Timer reset! Log reminder will trigger in ~10 seconds.');
                }}
                className="bg-white/20 hover:bg-white/30 text-white text-sm font-semibold px-4 py-2 rounded-lg transition"
              >🧪 Trigger in 10s</button>
            </div>
            <p className="text-xs text-white/50">Test Alert verifies sound/notifications. "Trigger in 10s" tests the log reminder system.</p>
          </Card>

        </div>
      </div>
    </AppLayout>
  );
};

export default ClimateMonitor;
