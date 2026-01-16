import React from 'react';
import type { Thresholds } from '../../types';

interface SettingsPanelProps {
    thresholds: Thresholds;
    onThresholdChange: (key: keyof Thresholds, value: number) => void;
}

// Threshold guidance based on hyperhidrosis research
const thresholdInfo = {
    temperature: {
        label: 'Temperature',
        unit: '°C',
        min: 24,
        max: 40,
        description: 'Below 24°C is generally comfortable. 28°C+ may trigger sweating.'
    },
    humidity: {
        label: 'Humidity',
        unit: '%',
        min: 50,
        max: 100,
        description: '70%+ humidity with warm temps significantly increases sweat risk.'
    },
    uvIndex: {
        label: 'UV Index',
        unit: '',
        min: 0,
        max: 11,
        description: 'High UV (6+) increases body heat and sweating.'
    }
};

export const SettingsPanel: React.FC<SettingsPanelProps> = ({ thresholds, onThresholdChange }) => {
    return (
        <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-4 space-y-4">
            <div>
                <h3 className="text-lg font-bold text-cyan-300">Personal Alert Thresholds</h3>
                <p className="text-xs text-gray-400 mt-1">
                    Customize when you receive alerts. Based on hyperhidrosis research.
                </p>
            </div>
            <div className="space-y-4">
                <div>
                    <label className="flex justify-between text-sm font-medium text-gray-300">
                        <span>{thresholdInfo.temperature.label}</span>
                        <span className="font-bold text-white">{thresholds.temperature}°C</span>
                    </label>
                    <input 
                        type="range" 
                        min={thresholdInfo.temperature.min} 
                        max={thresholdInfo.temperature.max} 
                        value={thresholds.temperature} 
                        onChange={(e) => onThresholdChange('temperature', +e.target.value)} 
                        className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer" 
                    />
                    <p className="text-xs text-gray-500 mt-1">{thresholdInfo.temperature.description}</p>
                </div>
                <div>
                    <label className="flex justify-between text-sm font-medium text-gray-300">
                        <span>{thresholdInfo.humidity.label}</span>
                        <span className="font-bold text-white">{thresholds.humidity}%</span>
                    </label>
                    <input 
                        type="range" 
                        min={thresholdInfo.humidity.min} 
                        max={thresholdInfo.humidity.max} 
                        value={thresholds.humidity} 
                        onChange={(e) => onThresholdChange('humidity', +e.target.value)} 
                        className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer" 
                    />
                    <p className="text-xs text-gray-500 mt-1">{thresholdInfo.humidity.description}</p>
                </div>
                <div>
                    <label className="flex justify-between text-sm font-medium text-gray-300">
                        <span>{thresholdInfo.uvIndex.label}</span>
                        <span className="font-bold text-white">{thresholds.uvIndex}</span>
                    </label>
                    <input 
                        type="range" 
                        min={thresholdInfo.uvIndex.min} 
                        max={thresholdInfo.uvIndex.max} 
                        step="1" 
                        value={thresholds.uvIndex} 
                        onChange={(e) => onThresholdChange('uvIndex', +e.target.value)} 
                        className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer" 
                    />
                    <p className="text-xs text-gray-500 mt-1">{thresholdInfo.uvIndex.description}</p>
                </div>
            </div>
        </div>
    );
}