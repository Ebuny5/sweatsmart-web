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
      {/* Icon with soft glow using drop-shadow filter */}
      <div
        className={`mb-4 ${colorClass}`}
        style={{ filter: 'drop-shadow(0 0 10px rgba(255,255,255,0.35))' }}
      >
        {icon}
      </div>

      {/* Label */}
      <p className="text-purple-200 text-sm font-medium mb-1">{label}</p>

      {/* Value */}
      <p className="text-3xl font-bold text-white tracking-tight">
        {typeof value === 'number' ? value.toFixed(2) : value}
        <span className="text-lg text-white/50 ml-1 font-normal">{unit}</span>
      </p>
    </div>
  );
};

export default SensorDisplayCard;
