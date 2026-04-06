import React from 'react';

interface SensorDisplayCardProps {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  unit: string;
  colorClass: string;
  valueColor?: string;
}

const SensorDisplayCard: React.FC<SensorDisplayCardProps> = ({ icon, label, value, unit, colorClass, valueColor }) => {
  const resolvedValueColor = valueColor ?? 'text-sky-400';
  return (
    <div className="
      bg-white/10
      backdrop-blur-xl
      border border-white/20
      p-6 rounded-2xl
      flex flex-col items-center justify-center text-center
      shadow-2xl
      transform hover:scale-[1.03] hover:bg-white/[0.14]
      transition-all duration-300
    ">
      <div className="mb-4">
        {icon}
      </div>
      <p className="text-purple-200 text-sm font-medium mb-1">{label}</p>
      <p className={`text-3xl font-bold tracking-tight ${resolvedValueColor}`}>
        {typeof value === 'number' ? value.toFixed(2) : value}
        <span className={`text-lg ml-1 font-normal opacity-75 ${resolvedValueColor}`}>{unit}</span>
      </p>
    </div>
  );
};

export default SensorDisplayCard;
