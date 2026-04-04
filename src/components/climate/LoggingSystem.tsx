import React from 'react';
import type { LogEntry } from '../../types';

interface LoggingSystemProps {
  logs: LogEntry[];
  isModalOpen: boolean;
  onCloseModal: () => void;
  onSubmitLog: (level: any) => void;
  onLogNow: () => void;
  nextLogTime: number | null;
  lastLogTime?: number | null;
}

export const LoggingSystem: React.FC<LoggingSystemProps> = ({
  logs, isModalOpen, onCloseModal, onSubmitLog, onLogNow, nextLogTime, lastLogTime
}) => {
  const formatTime = (timestamp: number) =>
    new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const formatDate = (timestamp: number) =>
    new Date(timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' });

  const formatNextLogTime = (next: number | null) => {
    if (!next) return '...';
    const now = Date.now();
    const remaining = Math.round((next - now) / (1000 * 60));
    if (remaining <= 0) return 'Now';
    const hrs = Math.floor(remaining / 60);
    const mins = remaining % 60;
    return `in ${hrs}h ${mins}m`;
  };

  // When the modal would open, redirect to the log episode page instead
  React.useEffect(() => {
    if (isModalOpen) {
      onCloseModal();
      onLogNow();
    }
  }, [isModalOpen, onCloseModal, onLogNow]);

  return (
    <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-4 space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-bold text-cyan-300">Compulsory Logging</h3>
        <button
          onClick={onLogNow}
          className="px-4 py-2 text-sm font-bold text-black bg-cyan-400 rounded-md hover:bg-cyan-300 transition"
        >Log Now</button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="text-center bg-gray-900 p-3 rounded-lg">
          <p className="text-sm text-gray-400">Last logged</p>
          <p className="text-lg font-bold text-white">
            {lastLogTime ? formatTime(lastLogTime) : '—'}
          </p>
          {lastLogTime && (
            <p className="text-xs text-gray-500">{formatDate(lastLogTime)}</p>
          )}
        </div>
        <div className="text-center bg-gray-900 p-3 rounded-lg">
          <p className="text-sm text-gray-400">Next reminder</p>
          <p className="text-2xl font-bold text-white">{formatNextLogTime(nextLogTime)}</p>
        </div>
      </div>
    </div>
  );
};
