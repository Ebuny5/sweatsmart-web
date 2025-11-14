import React, { useState, useEffect, useCallback, useMemo } from 'react';
import type { WeatherData, PhysiologicalData, Thresholds, LogEntry, HDSSLevel } from '@/types/climate';
import { LoggingSystem } from '@/components/climate/LoggingSystem';
import { ThermometerIcon, DropletIcon, SunIcon, ZapIcon, BellIcon, MapPinIcon, RefreshIcon } from '@/components/climate/icons.tsx';

const PHYSIOLOGICAL_EDA_THRESHOLD = 5.0;
const LOG_INTERVAL = 4 * 60 * 60 * 1000;
const DATA_SIMULATION_INTERVAL = 5000;

type PermissionStatus = 'prompt' | 'granted' | 'denied';

const PermissionsWizard: React.FC<{
  locationStatus: PermissionStatus;
  notificationStatus: PermissionStatus;
  onRequestLocation: () => void;
  onRequestNotification: () => void;
}> = ({ locationStatus, notificationStatus, onRequestLocation, onRequestNotification }) => {
    const isBlocked = locationStatus === 'denied' || notificationStatus === 'denied';

    return (
        <div className="bg-gray-800 border border-cyan-700/50 text-white p-4 rounded-xl flex flex-col items-center text-center space-y-4 shadow-lg">
            <h3 className="text-xl font-bold text-cyan-300">Setup Required</h3>
            <p className="text-sm text-gray-400 max-w-sm">
                Sweat Smart needs your permission for location and notifications to provide personalized, real-time alerts.
            </p>

            <div className="w-full space-y-3 pt-2">
                <div className="flex items-center justify-between bg-gray-900/70 p-3 rounded-lg">
                    <div className="flex items-center space-x-3">
                        <MapPinIcon className={`w-6 h-6 ${locationStatus === 'granted' ? 'text-green-400' : 'text-blue-400'}`} />
                        <span className="font-semibold">Local Weather</span>
                    </div>
                    {locationStatus === 'granted' && <span className="text-sm font-bold text-green-400">Enabled</span>}
                    {locationStatus === 'prompt' && (
                        <button onClick={onRequestLocation} className="bg-blue-500 text-white text-sm font-bold px-3 py-1 rounded-md hover:bg-blue-400 transition">
                            Enable Location
                        </button>
                    )}
                    {locationStatus === 'denied' && <span className="text-sm font-bold text-red-400">Blocked</span>}
                </div>

                <div className="flex items-center justify-between bg-gray-900/70 p-3 rounded-lg">
                    <div className="flex items-center space-x-3">
                        <BellIcon className={`w-6 h-6 ${notificationStatus === 'granted' ? 'text-green-400' : 'text-yellow-400'}`} />
                        <span className="font-semibold">Climate Alerts</span>
                    </div>
                    {notificationStatus === 'granted' && <span className="text-sm font-bold text-green-400">Enabled</span>}
                    {notificationStatus === 'prompt' && (
                        <button onClick={onRequestNotification} className="bg-yellow-500 text-black text-sm font-bold px-3 py-1 rounded-md hover:bg-yellow-400 transition disabled:bg-gray-600" disabled={locationStatus !== 'granted'}>
                            Enable Notifications
                        </button>
                    )}
                    {notificationStatus === 'denied' && <span className="text-sm font-bold text-red-400">Blocked</span>}
                </div>
            </div>

            {isBlocked && (
                <div className="w-full text-center bg-red-900/50 border border-red-700 p-3 rounded-lg mt-2">
                    <p className="text-sm text-red-200">
                        One or more permissions are blocked. Please update them in your browser's site settings for this page.
                    </p>
                </div>
            )}
        </div>
    );
};

const ClimateAlert = () => {
    const [locationPermission, setLocationPermission] = useState<PermissionStatus>('prompt');
    const [notificationPermission, setNotificationPermission] = useState<PermissionStatus>('prompt');
    const [location, setLocation] = useState<GeolocationCoordinates | null>(null);
    const [weatherData, setWeatherData] = useState<WeatherData>({ temperature: 25, humidity: 60, uvIndex: 5 });
    const [physiologicalData] = useState<PhysiologicalData>({ eda: 3.5 });
    const [thresholds, setThresholds] = useState<Thresholds>({ temperature: 30, humidity: 70, uvIndex: 7 });
    const [alertStatus, setAlertStatus] = useState<string>('Complete setup to begin.');
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [nextLogTime, setNextLogTime] = useState<number | null>(null);

    const arePermissionsGranted = useMemo(() => 
        locationPermission === 'granted' && notificationPermission === 'granted',
        [locationPermission, notificationPermission]
    );

    useEffect(() => {
        const storedThresholds = localStorage.getItem('sweatSmartThresholds');
        if (storedThresholds) setThresholds(JSON.parse(storedThresholds));

        const storedLogs = localStorage.getItem('sweatSmartLogs');
        if (storedLogs) setLogs(JSON.parse(storedLogs));

        checkPermissions();
    }, []);

    const checkPermissions = async () => {
        if ('permissions' in navigator) {
            try {
                const locPerm = await navigator.permissions.query({ name: 'geolocation' as PermissionName });
                setLocationPermission(locPerm.state as PermissionStatus);

                const notifPerm = await navigator.permissions.query({ name: 'notifications' as PermissionName });
                setNotificationPermission(notifPerm.state as PermissionStatus);
            } catch (error) {
                console.error('Error checking permissions:', error);
            }
        }
    };

    const requestLocation = () => {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                setLocation(position.coords);
                setLocationPermission('granted');
            },
            (error) => {
                console.error('Geolocation error:', error);
                setLocationPermission('denied');
            }
        );
    };

    const requestNotification = async () => {
        const permission = await Notification.requestPermission();
        setNotificationPermission(permission as PermissionStatus);
    };

    const updateNextLogTime = useCallback(() => {
        if (logs.length > 0) {
            const lastLog = logs[logs.length - 1];
            setNextLogTime(lastLog.timestamp + LOG_INTERVAL);
        } else {
            setNextLogTime(Date.now() + LOG_INTERVAL);
        }
    }, [logs]);

    useEffect(() => {
        localStorage.setItem('sweatSmartThresholds', JSON.stringify(thresholds));
    }, [thresholds]);

    useEffect(() => {
        localStorage.setItem('sweatSmartLogs', JSON.stringify(logs));
        updateNextLogTime();
    }, [logs, updateNextLogTime]);

    useEffect(() => {
        if (!arePermissionsGranted) return;

        const interval = setInterval(() => {
            setWeatherData(prev => ({
                temperature: prev.temperature + (Math.random() - 0.5) * 0.5,
                humidity: Math.max(0, Math.min(100, prev.humidity + (Math.random() - 0.5) * 2)),
                uvIndex: Math.max(0, Math.min(11, prev.uvIndex + (Math.random() - 0.5) * 0.2)),
            }));
        }, DATA_SIMULATION_INTERVAL);
        return () => clearInterval(interval);
    }, [arePermissionsGranted]);

    const sendNotification = useCallback((title: string, body: string) => {
        if (notificationPermission === 'granted') {
            new Notification(title, { body, icon: '/favicon.ico' });
        }
    }, [notificationPermission]);

    useEffect(() => {
        if (!arePermissionsGranted) {
             setAlertStatus("Complete setup to begin.");
             return;
        }

        const hasEnvironmentalAlert =
            weatherData.temperature > thresholds.temperature ||
            weatherData.humidity > thresholds.humidity ||
            weatherData.uvIndex > thresholds.uvIndex;

        const hasPhysiologicalAlert = physiologicalData.eda > PHYSIOLOGICAL_EDA_THRESHOLD;

        if (hasEnvironmentalAlert || hasPhysiologicalAlert) {
            const alerts: string[] = [];
            if (weatherData.temperature > thresholds.temperature) alerts.push(`High Temp (${weatherData.temperature.toFixed(1)}°C)`);
            if (weatherData.humidity > thresholds.humidity) alerts.push(`High Humidity (${weatherData.humidity.toFixed(0)}%)`);
            if (weatherData.uvIndex > thresholds.uvIndex) alerts.push(`High UV (${weatherData.uvIndex.toFixed(1)})`);
            if (hasPhysiologicalAlert) alerts.push(`High EDA (${physiologicalData.eda.toFixed(1)} µS)`);

            const message = `Alert: ${alerts.join(', ')}`;
            setAlertStatus(message);
            sendNotification('Sweat Smart Alert', message);
        } else {
            setAlertStatus('All conditions normal.');
        }
    }, [weatherData, physiologicalData, thresholds, arePermissionsGranted, sendNotification]);

    const handleLogNow = () => {
        setIsModalOpen(true);
    };

    const handleSubmitLog = (level: HDSSLevel) => {
        const newLog: LogEntry = {
            id: Math.random().toString(36).substring(7),
            timestamp: Date.now(),
            hdssLevel: level,
            weather: { ...weatherData },
            physiologicalData: { ...physiologicalData },
        };
        setLogs(prev => [...prev, newLog]);
        setIsModalOpen(false);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white p-4 md:p-8">
            <div className="max-w-7xl mx-auto space-y-6">
                <header className="text-center mb-8">
                    <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500 mb-2">
                        Sweat Smart Climate Alerts
                    </h1>
                    <p className="text-gray-400">Your Climate-Aware Companion</p>
                </header>

                {!arePermissionsGranted && (
                    <PermissionsWizard
                        locationStatus={locationPermission}
                        notificationStatus={notificationPermission}
                        onRequestLocation={requestLocation}
                        onRequestNotification={requestNotification}
                    />
                )}

                {arePermissionsGranted && (
                    <>
                        <div className="bg-gray-800 border border-cyan-700/50 p-6 rounded-2xl shadow-lg">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-2xl font-bold text-cyan-300">Current Status</h2>
                                <div className={`px-4 py-2 rounded-full font-semibold text-sm ${
                                    alertStatus.includes('Alert') ? 'bg-red-600' : 'bg-green-600'
                                }`}>
                                    {alertStatus.includes('Alert') ? '⚠️ ALERT' : '✓ Normal'}
                                </div>
                            </div>
                            <p className="text-gray-300">{alertStatus}</p>
                        </div>

                        <div className="grid md:grid-cols-3 gap-4">
                            <div className="bg-gray-800 border border-orange-700/50 p-4 rounded-xl">
                                <div className="flex items-center space-x-3 mb-2">
                                    <ThermometerIcon className="w-6 h-6 text-orange-400" />
                                    <h3 className="font-bold text-lg">Temperature</h3>
                                </div>
                                <p className="text-3xl font-bold text-orange-300">{weatherData.temperature.toFixed(1)}°C</p>
                                <input
                                    type="range"
                                    min="20"
                                    max="40"
                                    value={thresholds.temperature}
                                    onChange={(e) => setThresholds(prev => ({ ...prev, temperature: Number(e.target.value) }))}
                                    className="w-full mt-2"
                                />
                                <p className="text-sm text-gray-400 mt-1">Threshold: {thresholds.temperature}°C</p>
                            </div>

                            <div className="bg-gray-800 border border-blue-700/50 p-4 rounded-xl">
                                <div className="flex items-center space-x-3 mb-2">
                                    <DropletIcon className="w-6 h-6 text-blue-400" />
                                    <h3 className="font-bold text-lg">Humidity</h3>
                                </div>
                                <p className="text-3xl font-bold text-blue-300">{weatherData.humidity.toFixed(0)}%</p>
                                <input
                                    type="range"
                                    min="40"
                                    max="100"
                                    value={thresholds.humidity}
                                    onChange={(e) => setThresholds(prev => ({ ...prev, humidity: Number(e.target.value) }))}
                                    className="w-full mt-2"
                                />
                                <p className="text-sm text-gray-400 mt-1">Threshold: {thresholds.humidity}%</p>
                            </div>

                            <div className="bg-gray-800 border border-yellow-700/50 p-4 rounded-xl">
                                <div className="flex items-center space-x-3 mb-2">
                                    <SunIcon className="w-6 h-6 text-yellow-400" />
                                    <h3 className="font-bold text-lg">UV Index</h3>
                                </div>
                                <p className="text-3xl font-bold text-yellow-300">{weatherData.uvIndex.toFixed(1)}</p>
                                <input
                                    type="range"
                                    min="0"
                                    max="11"
                                    step="0.1"
                                    value={thresholds.uvIndex}
                                    onChange={(e) => setThresholds(prev => ({ ...prev, uvIndex: Number(e.target.value) }))}
                                    className="w-full mt-2"
                                />
                                <p className="text-sm text-gray-400 mt-1">Threshold: {thresholds.uvIndex}</p>
                            </div>
                        </div>

                        <div className="bg-gray-800 border border-purple-700/50 p-4 rounded-xl">
                            <div className="flex items-center space-x-3 mb-2">
                                <ZapIcon className="w-6 h-6 text-purple-400" />
                                <h3 className="font-bold text-lg">Physiological</h3>
                            </div>
                            <p className="text-2xl font-bold text-purple-300">EDA: {physiologicalData.eda.toFixed(1)} µS</p>
                            <p className="text-sm text-gray-400 mt-1">Threshold: {PHYSIOLOGICAL_EDA_THRESHOLD} µS</p>
                        </div>

                        <LoggingSystem
                            logs={logs}
                            isModalOpen={isModalOpen}
                            onCloseModal={() => setIsModalOpen(false)}
                            onSubmitLog={handleSubmitLog}
                            onLogNow={handleLogNow}
                            nextLogTime={nextLogTime}
                        />
                    </>
                )}
            </div>
        </div>
    );
};

export default ClimateAlert;
