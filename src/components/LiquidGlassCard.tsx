import React from 'react';

interface LiquidGlassCardProps {
  children: React.ReactNode;
  className?: string;
  glowColor?: 'teal' | 'amber' | 'blue' | 'red';
  pulse?: boolean;
}

export const LiquidGlassCard: React.FC<LiquidGlassCardProps> = ({ 
  children, 
  className = '', 
  glowColor = 'blue',
  pulse = false 
}) => {
  const glowColors = {
    teal: 'shadow-[0_0_32px_8px_rgba(127,227,198,0.15)]',
    amber: 'shadow-[0_0_32px_8px_rgba(255,191,0,0.2)]',
    blue: 'shadow-[0_0_32px_8px_rgba(58,123,213,0.15)]',
    red: 'shadow-[0_0_32px_8px_rgba(255,77,77,0.2)]',
  };

  return (
    <div 
      className={`
        relative
        backdrop-blur-[15px]
        bg-gradient-to-br from-white/[0.08] to-white/[0.02]
        border border-white/10
        rounded-2xl
        ${glowColors[glowColor]}
        ${pulse ? 'animate-pulse-glow' : ''}
        ${className}
      `}
      style={{
        backdropFilter: 'blur(15px)',
        WebkitBackdropFilter: 'blur(15px)',
      }}
    >
      {/* Light catcher edge */}
      <div className="absolute inset-0 rounded-2xl border border-white/5 pointer-events-none" />
      {children}
    </div>
  );
};

export default LiquidGlassCard;
