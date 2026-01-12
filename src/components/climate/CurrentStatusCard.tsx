import React, { useMemo } from 'react';
import type { WeatherData, PhysiologicalData } from '../../types';
import { ThermometerIcon, DropletIcon, SunIcon, ZapIcon } from '../icons';

interface CurrentStatusCardProps {
    weather: WeatherData;
    physiological: PhysiologicalData;
    alertStatus: string;
    isFetching: boolean;
    weatherError: string | null;
}

export const CurrentStatusCard: React.FC<CurrentStatusCardProps> = ({ weather, physiological, alertStatus, isFetching, weatherError }) => {
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
            <h3 className="text-lg font-bold text-amber-400">Current Status</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div className="bg-gray-900 p-3 rounded-lg"><ThermometerIcon className="w-6 h-6 mx-auto text-red-400 mb-1" /><p className="text-lg font-bold text-amber-200">{weather.temperature.toFixed(1)}°C</p><p className="text-xs text-gray-400">Temp</p></div>
                <div className="bg-gray-900 p-3 rounded-lg"><DropletIcon className="w-6 h-6 mx-auto text-blue-400 mb-1" /><p className="text-lg font-bold text-amber-200">{weather.humidity.toFixed(0)}%</p><p className="text-xs text-gray-400">Humidity</p></div>
                <div className="bg-gray-900 p-3 rounded-lg"><SunIcon className="w-6 h-6 mx-auto text-yellow-400 mb-1" /><p className="text-lg font-bold text-amber-200">{weather.uvIndex.toFixed(1)}</p><p className="text-xs text-gray-400">UV Index</p></div>
                <div className="bg-gray-900 p-3 rounded-lg"><ZapIcon className="w-6 h-6 mx-auto text-purple-400 mb-1" /><p className="text-lg font-bold text-amber-200">{physiological.eda.toFixed(1)} µS</p><p className="text-xs text-gray-400">EDA</p></div>
            </div>
            <div className={`bg-gray-900 p-3 rounded-lg text-center ${statusColor}`}>
                <p className="font-semibold">{alertStatus}</p>
            </div>
        </div>
    );
};