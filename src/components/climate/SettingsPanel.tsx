import React from 'react';
import type { Thresholds } from '../../types'; // Adjust path if types.ts is not in the same directory as App.tsx

interface SettingsPanelProps {
    thresholds: Thresholds;
    onThresholdChange: (key: keyof Thresholds, value: number) => void;
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({ thresholds, onThresholdChange }) => {
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