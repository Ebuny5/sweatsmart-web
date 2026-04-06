import React from 'react';
import { MODE_DETAILS } from './constants';
import { SimulationMode } from './types';

const ModeInfo: React.FC = () => {
  return (
    <div className="w-full max-w-4xl mx-auto mb-8">
      <h2 className="text-lg font-bold text-sky-400 mb-4 text-center sm:text-left tracking-tight">
        Simulation Parameters
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {(Object.keys(MODE_DETAILS) as SimulationMode[]).map((mode) => {
          const details = MODE_DETAILS[mode];
          return (
            <div
              key={mode}
              className="
                bg-black/20 backdrop-blur-md
                border border-white/12
                p-4 rounded-xl
                hover:bg-black/30 hover:border-white/20
                transition-all duration-300
              "
            >
              {/* Mode header */}
              <div className="flex items-center mb-3">
                <span className={`w-2.5 h-2.5 rounded-full mr-2.5 flex-shrink-0 ${details.dotColor}`}></span>
                <h3 className={`font-semibold text-sm ${details.textColor}`}>{mode}</h3>
              </div>

              {/* Ranges */}
              <ul className="space-y-1">
                {details.ranges.map((range) => (
                  <li key={range} className="text-xs text-amber-400 leading-relaxed">
                    {range}
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ModeInfo;
