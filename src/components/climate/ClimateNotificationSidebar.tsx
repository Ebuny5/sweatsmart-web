import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { GoogleGenAI, Type } from "@google/genai";
import type { WeatherData, PhysiologicalData, Thresholds, LogEntry, HDSSLevel } from '../../../types';
import { LoggingSystem } from '../../LoggingSystem';
import { ThermometerIcon, DropletIcon, SunIcon, ZapIcon, BellIcon, MapPinIcon, RefreshIcon } from '../../icons';

interface ClimateNotificationSidebarProps {
  isOpen: boolean;
  onClose?: () => void;
}

const PHYSIOLOGICAL_EDA_THRESHOLD = 5.0; // in µS
const LOG_INTERVAL = 4 * 60 * 60 * 1000; // 4 hours in milliseconds
const DATA_SIMULATION_INTERVAL = 5000; // 5 seconds
const LOG_CHECK_INTERVAL = 60000; // 1 minute

// --- Helper Components defined within the sidebar context ---

type PermissionStatus = 'prompt' | 'granted' | 'denied';

const PermissionsWizard: React.FC<{
  locationStatus: PermissionStatus;
  notificationStatus: PermissionStatus;
  onRequestLocation: () => void;
  onRequestNotification: () => void;
  onCheckPermissions: () => void;
}> = ({ locationStatus, notificationStatus, onRequestLocation, onRequestNotification, onCheckPermissions }) => {
    const isBlocked = locationStatus === 'denied' || notificationStatus === 'denied';
    
    return (
        <div className="bg-gray-800 border border-cyan-700/50 text-white p-4 rounded-xl flex flex-col items-center text-center space-y-4 shadow-lg">
            <h3 className="text-xl font-bold text-cyan-300">Setup Required</h3>
            <p className="text-sm text-gray-400 max-w-sm">
                Sweat Smart needs your permission for location and notifications to provide personalized, real-time alerts.
            </p>
            
            <div className="w-full space-y-3 pt-2">
                {/* Location Permission */}
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

                {/* Notification Permission */}
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
                    <button onClick={onCheckPermissions} className="mt-3 flex items-center justify-center mx-auto gap-2 bg-gray-200 text-black font-bold px-4 py-2 rounded-md hover:bg-white transition text-sm">
                       <RefreshIcon className="w-4 h-4" /> Check Permissions
                    </button>
                </div>
            )}
        </div>
    );
};

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
        <div className="relative bg-gray-800/50 border border-gray-700 rounded-xl p-4 space-y-4">
            {(isFetching || weatherError) && (
                 <div className="absolute inset-0 bg-gray-800/90 flex flex-col items-center justify-center rounded-xl z-10 p-4 text-center">
                    {isFetching && <p className="text-white font-semibold animate-pulse">Fetching local weather...</p>}
                    {weatherError && <p className="text-red-400 font-semibold">{weatherError}</p>}
                </div>
            )}
            <h3 className="text-lg font-bold text-cyan-300">Current Status</h3>
            <div className="grid grid-cols-2 gap-4 text-center"> {/* Adjusted grid for narrower sidebar */}
                <div className="bg-gray-900 p-3 rounded-lg"><ThermometerIcon className="w-6 h-6 mx-auto text-red-400 mb-1" /><p className="text-lg font-bold">{weather.temperature.toFixed(1)}°C</p><p className="text-xs text-gray-400">Temp</p></div>
                <div className="bg-gray-900 p-3 rounded-lg"><DropletIcon className="w-6 h-6 mx-auto text-blue-400 mb-1" /><p className="text-lg font-bold">{weather.humidity.toFixed(0)}%</p><p className="text-xs text-gray-400">Humidity</p></div>
                <div className="bg-gray-900 p-3 rounded-lg"><SunIcon className="w-6 h-6 mx-auto text-yellow-400 mb-1" /><p className="text-lg font-bold">{weather.uvIndex.toFixed(1)}</p><p className="text-xs text-gray-400">UV Index</p></div>
                <div className="bg-gray-900 p-3 rounded-lg"><ZapIcon className="w-6 h-6 mx-auto text-purple-400 mb-1" /><p className="text-lg font-bold">{physiological.eda.toFixed(1)} µS</p><p className="text-xs text-gray-400">EDA</p></div>
            </div>
            <div className={`bg-gray-900 p-3 rounded-lg text-center ${statusColor}`}>
                <p className="font-semibold">{alertStatus}</p>
            </div>
        </div>
    );
};

const SettingsPanel: React.FC<{
    thresholds: Thresholds;
    onThresholdChange: (key: keyof Thresholds, value: number) => void;
}> = ({ thresholds, onThresholdChange }) => {
    return (
        <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-4 space-y-4">
            <h3 className="text-lg font-bold text-cyan-300">Alert Thresholds</h3>
            <div className="space-y-4">
                <div>
                    <label className="flex justify-between text-sm font-medium text-gray-300"><span>Temperature</span><span className="font-bold text-white">{thresholds.temperature}°C</span></label>
                    <input type="range" min="15" max="40" value={thresholds.temperature} onChange={(e) => onThresholdChange('temperature', +e.target.value)} className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer" />
                </div>
                <div>
                    <label className="flex justify-between text-sm font-medium text-gray-300"><span>Humidity</span><span className="font-bold text-white">{thresholds.humidity}%</span></label>
                    <input type="range" min="30" max="100" value={thresholds.humidity} onChange={(e) => onThresholdChange('humidity', +e.target.value)} className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer" />
                </div>
                <div>
                    <label className="flex justify-between text-sm font-medium text-gray-300"><span>UV Index</span><span className="font-bold text-white">{thresholds.uvIndex}</span></label>
                    <input type="range" min="0" max="11" step="1" value={thresholds.uvIndex} onChange={(e) => onThresholdChange('uvIndex', +e.target.value)} className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer" />
                </div>
            </div>
        </div>
    );
}

// Store AudioContext in a global-like scope to avoid re-creation
let audioContext: AudioContext | null = null;
const initAudioContext = () => {
    if (!audioContext) {
        audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return audioContext;
};

const ClimateNotificationSidebar: React.FC<ClimateNotificationSidebarProps> = ({ isOpen, onClose }) => {
    const [notificationPermission, setNotificationPermission] = useState<PermissionStatus>('prompt');
    const [locationPermission, setLocationPermission] = useState<PermissionStatus>('prompt');
    const [location, setLocation] = useState<GeolocationCoordinates | null>(null);

    const [isFetchingWeather, setIsFetchingWeather] = useState(false);
    const [weatherError, setWeatherError] = useState<string|null>(null);
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

    // --- Permission and Initialization Effects ---
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
             // Fallback for older browsers
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
        updateNextLogTime();
    }, [logs]);

    // --- Data Fetching and Simulation ---

    const fetchWeatherData = useCallback(async (coords: GeolocationCoordinates) => {
        setIsFetchingWeather(true);
        setWeatherError(null);
        try {
            // Using import.meta.env for Vite environment variables
            const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_API_KEY as string });
            const response = await ai.models.generateContent({
                model: "gemini-2.5-flash",
                contents: `What is the current temperature in Celsius, humidity percentage, and UV index for latitude ${coords.latitude} and longitude ${coords.longitude}? Provide only the JSON object.`,
                config: {
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: Type.OBJECT,
                        properties: {
                            temperature: { type: Type.NUMBER, description: "Temperature in Celsius" },
                            humidity: { type: Type.NUMBER, description: "Humidity in percentage" },
                            uvIndex: { type: Type.NUMBER, description: "UV Index" },
                        },
                        required: ["temperature", "humidity", "uvIndex"],
                    },
                },
            });
            const weather = JSON.parse(response.text) as WeatherData;
            setWeatherData(weather);
        } catch (error) {
            console.error("Error fetching weather data from Gemini:", error);
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

    useEffect(() => {
        // Only run simulation if permissions are NOT granted AND no location is available (i.e. if actual fetching isn't happening)
        if (arePermissionsGranted && location) return;

        const interval = setInterval(() => {
            setWeatherData(prev => ({
                temperature: prev.temperature + (Math.random() - 0.5) * 0.5,
                humidity: Math.max(0, Math.min(100, prev.humidity + (Math.random() - 0.5) * 2)),
                uvIndex: Math.max(0, Math.min(11, prev.uvIndex + (Math.random() - 0.5) * 0.2)),
            }));
        }, DATA_SIMULATION_INTERVAL);
        return () => clearInterval(interval);
    }, [arePermissionsGranted, location]);

    // --- Alert Logic ---

    const playNotificationSound = useCallback(() => {
        const ctx = initAudioContext();
        if (ctx.state === 'suspended') {
            ctx.resume();
        }
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

    useEffect(() => {
        if (!arePermissionsGranted) {
             setAlertStatus("Complete setup to begin.");
             return;
        }

        const isEnvTrigger = weatherData.temperature > thresholds.temperature || weatherData.humidity > thresholds.humidity || weatherData.uvIndex > thresholds.uvIndex;
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
    
    useEffect(() => {
        const interval = setInterval(() => {
            setPhysiologicalData(prev => ({
                eda: Math.max(0, prev.eda + (Math.random() - 0.45) * 0.5)
            }));
        }, DATA_SIMULATION_INTERVAL);
        return () => clearInterval(interval);
    }, []);

    // --- Logging Logic ---

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

    // --- Handlers ---
    
    const requestNotificationPermission = async () => {
        if (locationPermission !== 'granted') return; // Gate notification request
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
        <div
            className={`fixed top-48 right-0 h-[calc(100vh-theme(spacing.48))] w-80 bg-gray-800 text-white shadow-lg z-40 p-4 transition-transform duration-300 ease-in-out
            ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
        >
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-cyan-400">Sweat Smart Climate Alerts</h2>
                {onClose && (
                    <button onClick={onClose} className="text-gray-400 hover:text-white">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                    </button>
                )}
            </div>

            <div className="space-y-4 overflow-y-auto h-[calc(100%-4rem)] pr-2"> {/* This is the content area */}
                {!arePermissionsGranted && (
                    <PermissionsWizard 
                        locationStatus={locationPermission}
                        notificationStatus={notificationPermission}
                        onRequestLocation={handleRequestLocation}
                        onRequestNotification={requestNotificationPermission}
                        onCheckPermissions={checkPermissions}
                    />
                )}
                
                <div className={`transition-opacity duration-500 space-y-4 ${arePermissionsGranted ? 'opacity-100' : 'opacity-40 blur-sm pointer-events-none'}`}>
                    <CurrentStatusCard weather={weatherData} physiological={physiologicalData} alertStatus={alertStatus} isFetching={isFetchingWeather} weatherError={weatherError} />
                    
                    <button onClick={() => setPhysiologicalData({eda: physiologicalData.eda + 5})} className="w-full text-center py-2 bg-purple-600 hover:bg-purple-500 rounded-lg transition-colors text-sm font-semibold">
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
        </div>
    );
};

export default ClimateNotificationSidebar;