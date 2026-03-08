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
import { LiquidGlassCard } from '@/components/LiquidGlassCard';
import { RefreshCw, MapPin, Bell, Zap, Settings } from 'lucide-react';

const TESTING_MODE = false;
const LOG_CHECK_INTERVAL = 30000;
const WEATHER_REFRESH_INTERVAL = 15 * 60 * 1000;

type PermissionStatus = 'prompt' | 'granted' | 'denied';

// Permissions Wizard with Liquid Glass styling
const PermissionsWizard: React.FC<{
  locationStatus: PermissionStatus;
  notificationStatus: PermissionStatus;
  onRequestLocation: () => void;
  onRequestNotification: () => void;
  onCheckPermissions: () => void;
}> = ({ locationStatus, notificationStatus, onRequestLocation, onRequestNotification, onCheckPermissions }) => {
  const isBlocked = locationStatus === 'denied' || notificationStatus === 'denied';
  return (
    <LiquidGlassCard glowColor="blue" className="p-6 space-y-4">
      <h3 className="text-2xl font-bold text-umbra">Setup Required</h3>
      <p className="text-umbra/60">SweatSmart needs location and notification permissions for real-time alerts.</p>
      <div className="space-y-3 pt-4">
        <div className="flex items-center justify-between bg-white/10 p-4 rounded-xl">
          <div className="flex items-center space-x-3">
            <MapPin className={`w-6 h-6 ${locationStatus === 'granted' ? 'text-calm-teal' : 'text-clinical-blue'}`} />
            <span className="font-semibold text-umbra">Local Weather</span>
          </div>
          {locationStatus === 'granted' && <span className="text-sm font-bold text-calm-teal">Enabled</span>}
          {locationStatus === 'prompt' && (
            <button onClick={onRequestLocation} className="bg-clinical-blue text-white text-sm font-bold px-4 py-2 rounded-xl hover:bg-clinical-blue/90 transition min-h-[44px]">
              Enable Location
            </button>
          )}
          {locationStatus === 'denied' && <span className="text-sm font-bold text-destructive">Blocked</span>}
        </div>
        <div className="flex items-center justify-between bg-white/10 p-4 rounded-xl">
          <div className="flex items-center space-x-3">
            <Bell className={`w-6 h-6 ${notificationStatus === 'granted' ? 'text-calm-teal' : 'text-warning-amber'}`} />
            <span className="font-semibold text-umbra">Climate Alerts</span>
          </div>
          {notificationStatus === 'granted' && <span className="text-sm font-bold text-calm-teal">Enabled</span>}
          {notificationStatus === 'prompt' && (
            <button
              onClick={onRequestNotification}
              className="bg-warning-amber text-umbra text-sm font-bold px-4 py-2 rounded-xl hover:bg-warning-amber/90 transition disabled:opacity-40 min-h-[44px]"
              disabled={locationStatus !== 'granted'}
            >
              Enable Notifications
            </button>
          )}
          {notificationStatus === 'denied' && <span className="text-sm font-bold text-destructive">Blocked</span>}
        </div>
      </div>
      {isBlocked && (
        <div className="bg-destructive/10 border border-destructive/30 p-4 rounded-xl">
          <p className="text-sm text-umbra/80 mb-3">Permissions blocked. Update them in your browser site settings.</p>
          <button onClick={onCheckPermissions} className="flex items-center gap-2 bg-surgical-steel text-umbra font-bold px-4 py-2 rounded-xl hover:bg-surgical-steel/80 transition text-sm min-h-[44px]">
            <RefreshCw className="w-4 h-4" /> Check Permissions
          </button>
        </div>
      )}
    </LiquidGlassCard>
  );
};

// Weather error card
const WeatherErrorCard: React.FC<{ error: string; onRetry: () => void; isFetching: boolean }> = ({ error, onRetry, isFetching }) => (
  <LiquidGlassCard glowColor="red" className="p-6 text-center space-y-3">
    <p className="text-destructive font-semibold">⚠️ Could not fetch real weather data</p>
    <p className="text-umbra/60 text-sm">{error}</p>
    <p className="text-umbra/40 text-xs">No alerts will fire until real data is available.</p>
    <button onClick={onRetry} disabled={isFetching} className="bg-clinical-blue hover:bg-clinical-blue/90 text-white font-bold px-6 py-3 rounded-xl transition min-h-[56px] inline-flex items-center gap-2">
      <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
      {isFetching ? 'Retrying...' : 'Retry'}
    </button>
  </LiquidGlassCard>
);

// Risk calculation helper
const getRiskInfo = (weather: WeatherData, alertStatus: string) => {
  if (alertStatus.includes("Extreme")) return { level: 'EXTREME' as const, color: 'red' as const, pulse: true };
  if (alertStatus.includes("High")) return { level: 'HIGH' as const, color: 'red' as const, pulse: true };
  if (alertStatus.includes("Moderate")) return { level: 'MODERATE' as const, color: 'amber' as const, pulse: false };
  if (alertStatus.includes("Low")) return { level: 'LOW' as const, color: 'teal' as const, pulse: false };
  return { level: 'SAFE' as const, color: 'teal' as const, pulse: false };
};

const getRiskBarWidth = (level: string) => {
  switch (level) {
    case 'SAFE': return 'w-1/5';
    case 'LOW': return 'w-1/4';
    case 'MODERATE': return 'w-1/2';
    case 'HIGH': return 'w-3/4';
    case 'EXTREME': return 'w-full';
    default: return 'w-0';
  }
};

const getRiskBarColor = (level: string) => {
  switch (level) {
    case 'SAFE':
    case 'LOW': return 'bg-calm-teal';
    case 'MODERATE': return 'bg-warning-amber';
    case 'HIGH':
    case 'EXTREME': return 'bg-destructive';
    default: return 'bg-muted';
  }
};

const getRiskBadgeClasses = (level: string) => {
  switch (level) {
    case 'SAFE':
    case 'LOW': return 'bg-calm-teal/20 text-calm-teal';
    case 'MODERATE': return 'bg-warning-amber/20 text-warning-amber';
    case 'HIGH':
    case 'EXTREME': return 'bg-destructive/20 text-destructive';
    default: return 'bg-muted text-muted-foreground';
  }
};

const getRecommendations = (level: string) => {
  switch (level) {
    case 'SAFE':
    case 'LOW':
      return [{ emoji: '✓', text: 'Comfortable conditions — continue with normal activities' }];
    case 'MODERATE':
      return [
        { emoji: '💧', text: 'Stay hydrated throughout the day' },
        { emoji: '❄️', text: 'Use cooling devices or AC when possible' },
        { emoji: '🧴', text: 'Apply antiperspirant before going out' },
      ];
    case 'HIGH':
      return [
        { emoji: '💧', text: 'Stay hydrated — increase water intake' },
        { emoji: '❄️', text: 'Use cooling devices, stay in air conditioning' },
        { emoji: '🧴', text: 'Apply clinical-strength antiperspirant' },
        { emoji: '📋', text: 'Consider iontophoresis session if available' },
      ];
    case 'EXTREME':
      return [
        { emoji: '⚠️', text: 'Avoid outdoor activities — extreme conditions' },
        { emoji: '❄️', text: 'Stay indoors with air conditioning' },
        { emoji: '📞', text: 'Contact your dermatologist if symptoms worsen' },
      ];
    default:
      return [];
  }
};

// Current Status Card with Liquid Glass
const CurrentStatusCard: React.FC<{
  weather: WeatherData;
  physiological: PhysiologicalData;
  alertStatus: string;
  isFetching: boolean;
}> = ({ weather, physiological, alertStatus, isFetching }) => {
  const risk = getRiskInfo(weather, alertStatus);
  const displayUV = Math.min(11, weather.uvIndex);

  const getLastUpdatedText = () => {
    if (!weather.lastUpdated) return null;
    const diff = Math.floor((Date.now() - weather.lastUpdated) / 1000);
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    return `${Math.floor(diff / 3600)}h ago`;
  };

  // Extract a clinical AI message from alertStatus
  const getAIMessage = () => {
    const cleanStatus = alertStatus.replace(/^[^:]+:\s*/, '');
    return cleanStatus || alertStatus;
  };

  return (
    <>
      <LiquidGlassCard glowColor={risk.color} pulse={risk.pulse} className="p-6">
        {isFetching && (
          <div className="absolute inset-0 bg-french-porcelain/90 flex flex-col items-center justify-center rounded-2xl z-10">
            <p className="text-umbra font-semibold animate-pulse">Fetching real weather data...</p>
          </div>
        )}

        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="text-umbra/60 text-sm">Current Status</span>
            {weather.location && <span className="text-xs text-clinical-blue">📍 {weather.location}</span>}
          </div>
          <div className="flex items-center gap-2">
            {weather.lastUpdated && (
              <span className="text-xs text-umbra/40">🔄 {getLastUpdatedText()}</span>
            )}
            <div className={`px-3 py-1.5 rounded-full font-bold text-xs ${getRiskBadgeClasses(risk.level)}`}>
              {risk.level}
            </div>
          </div>
        </div>

        {/* Environmental Metrics */}
        <div className="grid grid-cols-4 gap-3 mb-6">
          <div className="text-center">
            <div className="text-3xl mb-2">🌡️</div>
            <div className="text-xl font-bold text-umbra">{weather.temperature.toFixed(1)}°C</div>
            <div className="text-xs text-umbra/50">Temperature</div>
          </div>
          <div className="text-center">
            <div className="text-3xl mb-2">💧</div>
            <div className="text-xl font-bold text-umbra">{weather.humidity.toFixed(0)}%</div>
            <div className="text-xs text-umbra/50">Humidity</div>
          </div>
          <div className="text-center">
            <div className="text-3xl mb-2">☀️</div>
            <div className="text-xl font-bold text-umbra">{displayUV.toFixed(1)}</div>
            <div className="text-xs text-umbra/50">UV Index</div>
          </div>
          <div className="text-center">
            <div className="text-3xl mb-2">⚡</div>
            <div className="text-xl font-bold text-umbra">{physiological.eda.toFixed(1)} µS</div>
            <div className="text-xs text-umbra/50">EDA</div>
          </div>
        </div>

        {weather.description && (
          <p className="text-center text-sm text-umbra/60 capitalize mb-4">{weather.description}</p>
        )}

        {/* Risk Visualization Bar */}
        <div className="relative h-3 bg-white/20 rounded-full overflow-hidden mb-4">
          <div className={`absolute top-0 left-0 h-full transition-all duration-500 rounded-full ${getRiskBarWidth(risk.level)} ${getRiskBarColor(risk.level)}`} />
        </div>

        {/* AI Companion Message */}
        <div className="bg-white/10 rounded-xl p-4 border border-white/10">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-clinical-blue/20 flex items-center justify-center flex-shrink-0">
              <span className="text-clinical-blue font-bold text-sm">AI</span>
            </div>
            <div>
              <div className="text-xs text-umbra/50 mb-1">Hyper Climate Analysis</div>
              <p className="text-umbra/90 text-sm leading-relaxed">{getAIMessage()}</p>
            </div>
          </div>
        </div>
      </LiquidGlassCard>

      {/* Recommendations */}
      <LiquidGlassCard className="p-6">
        <h3 className="text-lg font-bold text-umbra mb-4">Recommended Actions</h3>
        <div className="space-y-3">
          {getRecommendations(risk.level).map((rec, i) => (
            <div key={i} className="flex items-start gap-3">
              <span className="text-2xl">{rec.emoji}</span>
              <p className="text-umbra/80 text-sm pt-1">{rec.text}</p>
            </div>
          ))}
        </div>
      </LiquidGlassCard>
    </>
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
  const [lastAlertType, setLastAlertType] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);

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
        (position) => {
          setLocation(position.coords);
          setLocationPermission('granted');
        },
        (error) => {
          if (error.code === error.PERMISSION_DENIED) setLocationPermission('denied');
        },
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

  useEffect(() => {
    localStorage.setItem('sweatSmartThresholds', JSON.stringify(thresholds));
  }, [thresholds]);

  useEffect(() => {
    localStorage.setItem('sweatSmartLogs', JSON.stringify(logs));
  }, [logs]);

  const fetchWeatherData = useCallback(async (coords: GeolocationCoordinates) => {
    setIsFetchingWeather(true);
    setWeatherError(null);
    try {
      const { data, error } = await supabase.functions.invoke('get-weather-data', {
        body: { latitude: coords.latitude, longitude: coords.longitude }
      });
      if (error) throw new Error(error.message);
      if (data.simulated) {
        throw new Error(data.error || 'Weather API unavailable — no real data received.');
      }
      setWeatherData({
        ...data,
        uvIndex: Math.min(11, data.uvIndex ?? data.uvi ?? 0),
        lastUpdated: Date.now(),
      });
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
      setPhysiologicalData(prev => ({
        eda: Math.max(0, prev.eda + (Math.random() - 0.45) * 0.5)
      }));
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const playAlertSound = useCallback(
    (severity: 'CRITICAL' | 'WARNING' | 'REMINDER' = 'WARNING') => {
      soundManager.triggerMedicalAlert(severity);
    }, []
  );

  const sendNotification = useCallback(
    async (title: string, body: string, severity: 'CRITICAL' | 'WARNING' | 'REMINDER' = 'WARNING') => {
      playAlertSound(severity);
      if ('serviceWorker' in navigator && notificationPermission === 'granted') {
        try {
          const registration = await navigator.serviceWorker.ready;
          await registration.showNotification(title, {
            body,
            icon: '/icon-192.png',
            badge: '/icon-192.png',
            tag: `sweatsmart-climate-${Date.now()}`,
            requireInteraction: severity === 'CRITICAL',
            vibrate: severity === 'CRITICAL' ? [800, 200, 800, 200, 800] : [400, 100, 400],
          } as NotificationOptions);
        } catch (err) {
          console.error('📱 Notification failed:', err);
        }
      }
    },
    [notificationPermission, playAlertSound]
  );

  useEffect(() => {
    if (!arePermissionsGranted) {
      setAlertStatus("Complete setup to begin.");
      return;
    }
    if (!hasRealWeather || !weatherData) {
      setAlertStatus("Waiting for real weather data...");
      return;
    }

    const settings = localStorage.getItem('climateAppSettings');
    const soundEnabled = settings ? JSON.parse(settings).soundAlerts !== false : true;
    const safeUV = Math.min(11, weatherData.uvIndex);

    const risk = calculateSweatRisk(
      weatherData.temperature,
      weatherData.humidity,
      safeUV,
      physiologicalData.eda,
      false
    );

    const riskToAlertType: Record<SweatRiskLevel, string> = {
      safe: 'optimal',
      low: 'optimal',
      moderate: 'moderate',
      high: 'high',
      extreme: 'high',
    };

    const currentAlertType = riskToAlertType[risk.level];

    if (risk.level === 'safe') {
      setAlertStatus("Conditions Optimal: Comfortable conditions for hyperhidrosis management.");
    } else if (risk.level === 'low') {
      setAlertStatus("Low Risk: Mild conditions — stay hydrated and monitor.");
    } else {
      setAlertStatus(`${risk.message}: ${risk.description}`);
    }

    if (soundEnabled && currentAlertType !== lastAlertType && currentAlertType !== 'optimal') {
      const severity = getRiskSeverity(risk.level);
      sendNotification(
        `SweatSmart Alert — ${risk.message}`,
        `Temp: ${weatherData.temperature.toFixed(1)}°C | Humidity: ${weatherData.humidity.toFixed(0)}% | UV: ${safeUV.toFixed(1)}`,
        severity
      );
    }

    setLastAlertType(currentAlertType);
  }, [weatherData, physiologicalData, sendNotification, arePermissionsGranted, lastAlertType, hasRealWeather]);

  // Logging schedule
  const updateNextLogTime = useCallback(() => {
    const now = Date.now();
    let nextTime: number;
    if (TESTING_MODE) {
      nextTime = now + 4 * 60 * 60 * 1000;
    } else {
      const blocks = [0, 4, 8, 12, 16, 20];
      const currentDate = new Date();
      const currentHour = currentDate.getHours();
      let nextBlockHour = blocks.find(b => b > currentHour);
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
  }, []);

  useEffect(() => {
    if (!TESTING_MODE) { updateNextLogTime(); return; }
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
              icon: '/icon-192.png',
              badge: '/icon-192.png',
              tag: 'log-reminder',
              requireInteraction: true,
              data: { url: '/climate' }
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
        setLocation(position.coords);
        setLocationPermission('granted');
        if (notificationPermission === 'prompt') requestNotificationPermission();
      },
      (error) => {
        if (error.code === error.PERMISSION_DENIED) setLocationPermission('denied');
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
      weather: weatherData ?? { temperature: 0, humidity: 0, uvIndex: 0 },
      physiologicalData,
    };
    setLogs(prev => [...prev, newLog]);
    setIsLoggingModalOpen(false);
  };

  return (
    <AppLayout>
      <div className="min-h-full bg-french-porcelain p-6 rounded-xl space-y-6 pb-32">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-umbra mb-2">Climate Intelligence</h1>
          <p className="text-umbra/60">Real-time environmental monitoring for hyperhidrosis management</p>
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

          {weatherError && (
            <WeatherErrorCard
              error={weatherError}
              onRetry={() => location && fetchWeatherData(location)}
              isFetching={isFetchingWeather}
            />
          )}

          {hasRealWeather && weatherData && (
            <CurrentStatusCard
              weather={weatherData}
              physiological={physiologicalData}
              alertStatus={alertStatus}
              isFetching={isFetchingWeather}
            />
          )}

          {!weatherError && !hasRealWeather && arePermissionsGranted && (
            <LiquidGlassCard glowColor="blue" className="p-6 text-center">
              <p className="text-umbra font-semibold animate-pulse">Fetching real weather data for your location...</p>
            </LiquidGlassCard>
          )}

          {/* EDA Section */}
          <LiquidGlassCard className="p-6">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-sm text-umbra/60">Electrodermal Activity (EDA)</p>
                <p className="text-2xl font-bold text-clinical-blue">{physiologicalData.eda.toFixed(1)} µS</p>
              </div>
              {(() => {
                const storedEDA = edaManager.getEDA();
                const isFresh = edaManager.isFresh();
                if (storedEDA && isFresh) return (
                  <span className="text-xs bg-calm-teal/20 text-calm-teal px-3 py-1 rounded-full border border-calm-teal/30">Fresh • {storedEDA.source}</span>
                );
                if (storedEDA && !isFresh) return (
                  <span className="text-xs bg-warning-amber/20 text-warning-amber px-3 py-1 rounded-full border border-warning-amber/30">Stale • Generate new</span>
                );
                return (
                  <span className="text-xs bg-muted text-muted-foreground px-3 py-1 rounded-full">No data</span>
                );
              })()}
            </div>
          </LiquidGlassCard>

          {/* Settings (collapsible) */}
          {showSettings && (
            <>
              <SettingsPanel thresholds={thresholds} onThresholdChange={handleThresholdChange} />
              <WebPushSettings thresholds={thresholds} />
            </>
          )}

          <LoggingSystem
            logs={logs}
            isModalOpen={isLoggingModalOpen}
            onCloseModal={() => setIsLoggingModalOpen(false)}
            onSubmitLog={handleLogSubmit}
            onLogNow={() => navigate('/log-episode')}
            nextLogTime={nextLogTime}
          />
        </div>

        {/* Fixed Bottom Action Buttons - Thumb Zone */}
        <div className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-french-porcelain via-french-porcelain to-transparent z-20">
          <div className="max-w-2xl mx-auto flex gap-4">
            {location && (
              <button
                onClick={() => fetchWeatherData(location)}
                disabled={isFetchingWeather}
                className="flex-1 h-14 rounded-xl font-bold bg-clinical-blue text-white hover:bg-clinical-blue/90 active:scale-95 transition-all duration-200 min-h-[56px] inline-flex items-center justify-center gap-2"
              >
                <RefreshCw className={`h-5 w-5 ${isFetchingWeather ? 'animate-spin' : ''}`} />
                {isFetchingWeather ? 'Refreshing...' : 'Refresh Data'}
              </button>
            )}
            <button
              onClick={() => {
                const eda = physiologicalData.eda;
                const mode = eda > 10 ? 'Trigger' : eda > 5 ? 'Active' : 'Resting';
                navigate(`/palm-scanner?returnTo=/climate&mode=${mode}`);
              }}
              className="flex-1 h-14 rounded-xl font-bold bg-calm-teal/20 text-umbra hover:bg-calm-teal/30 active:scale-95 transition-all duration-200 min-h-[56px] inline-flex items-center justify-center gap-2"
            >
              <Zap className="h-5 w-5" />
              Palm Scanner
            </button>
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="h-14 w-14 rounded-xl bg-white/20 backdrop-blur-sm hover:bg-white/30 active:scale-95 transition-all duration-200 flex items-center justify-center min-w-[56px] min-h-[56px]"
            >
              <Settings className="h-6 w-6 text-umbra" />
            </button>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default ClimateMonitor;
