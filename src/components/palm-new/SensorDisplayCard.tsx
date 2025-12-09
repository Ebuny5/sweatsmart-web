import React from 'react';

interface SensorDisplayCardProps {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  unit: string;
  colorClass: string;
}

const SensorDisplayCard: React.FC<SensorDisplayCardProps> = ({ icon, label, value, unit, colorClass }) => {
  return (
    <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 flex flex-col items-center justify-center text-center transform hover:scale-105 transition-transform duration-300">
      <div className={`mb-4 ${colorClass}`}>
        {icon}
      </div>
      <p className="text-slate-400 text-sm">{label}</p>
      <p className="text-3xl font-bold text-white">
        {typeof value === 'number' ? value.toFixed(2) : value}
        <span className="text-lg text-slate-400 ml-1">{unit}</span>
      </p>
    </div>
  );
};

export default SensorDisplayCard;
