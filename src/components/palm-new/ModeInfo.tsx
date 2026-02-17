import React from 'react';
import { MODE_DETAILS } from './constants';
import { SimulationMode } from './types';

const ModeInfo: React.FC = () => {
  return (
    <div className="w-full max-w-4xl mx-auto mb-8">
      <h2 className="text-xl font-bold text-amber-300 mb-4 text-center sm:text-left">Simulation Parameters</h2>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {(Object.keys(MODE_DETAILS) as SimulationMode[]).map((mode) => (
          <div key={mode} className="bg-slate-800/50 p-4 rounded-lg border border-slate-700">
            <div className="flex items-center mb-2">
              <span className={`w-3 h-3 rounded-full mr-2 ${MODE_DETAILS[mode].color}`}></span>
              <h3 className={`font-semibold ${MODE_DETAILS[mode].textColor}`}>{mode}</h3>
            </div>
            <ul className="text-sm text-slate-400 space-y-1">
              {MODE_DETAILS[mode].ranges.map((range) => <li key={range}>{range}</li>)}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ModeInfo;
