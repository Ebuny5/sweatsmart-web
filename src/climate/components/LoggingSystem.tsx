import React, { useState } from 'react';
import type { LogEntry, HDSSLevel } from '../types';

const HDSS_DESCRIPTIONS: Record<HDSSLevel, { title: string; desc: string }> = {
  1: { title: 'Never Noticeable', desc: 'My sweating is never noticeable and never interferes with my daily activities.' },
  2: { title: 'Tolerable', desc: 'My sweating is tolerable but sometimes interferes with my daily activities.' },
  3: { title: 'Barely Tolerable', desc: 'My sweating is barely tolerable and frequently interferes with my daily activities.' },
  4: { title: 'Intolerable', desc: 'My sweating is intolerable and always interferes with my daily activities.' },
};

interface LoggingSystemProps {
  logs: LogEntry[];
  isModalOpen: boolean;
  onCloseModal: () => void;
  onSubmitLog: (level: HDSSLevel) => void;
  onLogNow: () => void;
  nextLogTime: number | null;
}

const LoggingModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (level: HDSSLevel) => void;
}> = ({ isOpen, onClose, onSubmit }) => {
  const [selectedLevel, setSelectedLevel] = useState<HDSSLevel | null>(null);

  const handleSubmit = () => {
    if (selectedLevel) {
      onSubmit(selectedLevel);
      setSelectedLevel(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-2xl shadow-2xl p-6 w-full max-w-md text-white border border-gray-700">
        <h2 className="text-2xl font-bold mb-1 text-cyan-300">Log Your Sweat Level</h2>
        <p className="text-gray-400 mb-6">Based on the Hyperhidrosis Disease Severity Scale (HDSS).</p>
        <div className="space-y-3">
          {/* FIX: Use Object.entries to safely iterate over the descriptions object. This avoids a problematic type cast on Object.keys. */}
          {Object.entries(HDSS_DESCRIPTIONS).map(([level, content]) => {
            const levelNum = Number(level) as HDSSLevel;
            return (
              <div
                key={levelNum}
                onClick={() => setSelectedLevel(levelNum)}
                className={`p-4 border-2 rounded-lg cursor-pointer transition-all duration-200 ${
                  selectedLevel === levelNum ? 'border-cyan-400 bg-gray-700' : 'border-gray-600 hover:border-cyan-500 hover:bg-gray-700/50'
                }`}
              >
                <label className="flex items-center space-x-4 cursor-pointer">
                  <div className="flex-shrink-0 text-2xl font-bold text-cyan-400">{levelNum}</div>
                  <div>
                    <p className="font-semibold text-white">{content.title}</p>
                    <p className="text-sm text-gray-400">{content.desc}</p>
                  </div>
                </label>
              </div>
            );
          })}
        </div>
        <div className="mt-6 flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-md bg-gray-600 hover:bg-gray-500 text-white font-semibold transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!selectedLevel}
            className="px-6 py-2 rounded-md bg-cyan-500 hover:bg-cyan-400 text-black font-bold transition-colors disabled:bg-gray-500 disabled:cursor-not-allowed"
          >
            Submit
          </button>
        </div>
      </div>
    </div>
  );
};

export const LoggingSystem: React.FC<LoggingSystemProps> = ({ logs, isModalOpen, onCloseModal, onSubmitLog, onLogNow, nextLogTime }) => {
    
    const formatTime = (timestamp: number) => {
        return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }

    const formatDate = (timestamp: number) => {
        const date = new Date(timestamp);
        return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }

    const formatNextLogTime = (timestamp: number | null) => {
        if (!timestamp) return '...';
        const now = Date.now();
        const diffMinutes = Math.round((timestamp - now) / (1000 * 60));
        if (diffMinutes <= 0) return 'Now';
        const hours = Math.floor(diffMinutes / 60);
        const minutes = diffMinutes % 60;
        return `in ${hours}h ${minutes}m`;
    }

    return (
    <>
      <LoggingModal isOpen={isModalOpen} onClose={onCloseModal} onSubmit={onSubmitLog} />
      <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-4 space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-bold text-cyan-300">Compulsory Logging</h3>
          <button 
            onClick={onLogNow}
            className="px-4 py-2 text-sm font-bold text-black bg-cyan-400 rounded-md hover:bg-cyan-300 transition"
          >
            Log Now
          </button>
        </div>
        <div className="text-center bg-gray-900 p-3 rounded-lg">
            <p className="text-sm text-gray-400">Next scheduled log</p>
            <p className="text-2xl font-bold text-white">{formatNextLogTime(nextLogTime)}</p>
        </div>
        
        <h4 className="text-md font-semibold text-gray-300 pt-2">Log History</h4>
        <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
          {logs.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No logs yet.</p>
          ) : (
            [...logs].reverse().map(log => (
              <div key={log.id} className="bg-gray-700/50 p-3 rounded-lg flex justify-between items-center">
                <div className="flex items-center space-x-3">
                    <div className={`w-10 h-10 flex items-center justify-center rounded-full font-bold text-xl text-black bg-cyan-${(5-log.hdssLevel)*100}`}>
                        {log.hdssLevel}
                    </div>
                    <div>
                        <p className="font-semibold text-white">{HDSS_DESCRIPTIONS[log.hdssLevel].title}</p>
                        <p className="text-xs text-gray-400">
                            {log.weather.temperature}°C, {log.weather.humidity}% H, {log.weather.uvIndex} UV, {log.physiologicalData.eda.toFixed(1)} µS
                        </p>
                    </div>
                </div>
                <div className="text-right">
                    <p className="text-sm font-semibold text-gray-300">{formatTime(log.timestamp)}</p>
                    <p className="text-xs text-gray-500">{formatDate(log.timestamp)}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
};