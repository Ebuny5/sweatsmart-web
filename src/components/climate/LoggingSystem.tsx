import React, { useState } from 'react';
import type { LogEntry, HDSSLevel } from '@/types/climate';

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
          {([1, 2, 3, 4] as HDSSLevel[]).map((level) => {
            const { title, desc } = HDSS_DESCRIPTIONS[level];
            return (
              <button
                key={level}
                onClick={() => setSelectedLevel(level)}
                className={`w-full text-left p-4 rounded-lg border-2 transition ${
                  selectedLevel === level
                    ? 'border-cyan-500 bg-cyan-900/30'
                    : 'border-gray-600 hover:border-gray-500 bg-gray-900/40'
                }`}
              >
                <div className="font-semibold text-lg text-cyan-200">Level {level}</div>
                <div className="text-sm text-gray-300 font-medium mb-1">{title}</div>
                <div className="text-xs text-gray-400">{desc}</div>
              </button>
            );
          })}
        </div>
        <div className="flex space-x-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition font-semibold"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!selectedLevel}
            className="flex-1 px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-500 transition font-semibold disabled:bg-gray-600 disabled:cursor-not-allowed"
          >
            Submit Log
          </button>
        </div>
      </div>
    </div>
  );
};

export const LoggingSystem: React.FC<LoggingSystemProps> = ({
  logs,
  isModalOpen,
  onCloseModal,
  onSubmitLog,
  onLogNow,
  nextLogTime,
}) => {
  const timeUntilNextLog = nextLogTime ? nextLogTime - Date.now() : null;
  const hours = timeUntilNextLog ? Math.floor(timeUntilNextLog / (1000 * 60 * 60)) : 0;
  const minutes = timeUntilNextLog ? Math.floor((timeUntilNextLog % (1000 * 60 * 60)) / (1000 * 60)) : 0;

  return (
    <div className="bg-gray-900 border border-gray-700 text-white p-6 rounded-2xl space-y-4 shadow-lg">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-cyan-300">HDSS Logging</h3>
        <button
          onClick={onLogNow}
          className="px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-500 transition text-sm font-semibold"
        >
          Log Now
        </button>
      </div>
      {nextLogTime && (
        <p className="text-sm text-gray-400">
          Next automatic log in: <span className="font-semibold text-cyan-200">{hours}h {minutes}m</span>
        </p>
      )}
      <div className="space-y-2 max-h-60 overflow-y-auto">
        {logs.length === 0 && <p className="text-sm text-gray-500">No logs yet.</p>}
        {logs.slice().reverse().map((log) => {
          const { title } = HDSS_DESCRIPTIONS[log.hdssLevel];
          return (
            <div key={log.id} className="bg-gray-800 p-3 rounded-lg border border-gray-700">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-cyan-200">Level {log.hdssLevel} - {title}</span>
                <span className="text-xs text-gray-400">{new Date(log.timestamp).toLocaleString()}</span>
              </div>
              <div className="text-xs text-gray-500 mt-1">
                Temp: {log.weather.temperature.toFixed(1)}°C | Humidity: {log.weather.humidity.toFixed(0)}% | UV: {log.weather.uvIndex.toFixed(1)}
              </div>
            </div>
          );
        })}
      </div>
      <LoggingModal isOpen={isModalOpen} onClose={onCloseModal} onSubmit={onSubmitLog} />
    </div>
  );
};
