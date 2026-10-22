import React from 'react';
import { Activity, Apple, Sparkles } from 'lucide-react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  title?: string;
  subtitle?: string;
}

export const Logo: React.FC<LogoProps> = ({
  size = 'md',
  className = '',
  title = 'Almeida Nutri',
  subtitle = 'Gestão Nutricional Inteligente',
}) => {
  const iconSizes = {
    sm: 'w-8 h-8',
    md: 'w-11 h-11',
    lg: 'w-14 h-14',
  };

  const textSizes = {
    sm: 'text-xl',
    md: 'text-2xl',
    lg: 'text-3xl',
  };

  const subTextSizes = {
    sm: 'text-[10px]',
    md: 'text-xs',
    lg: 'text-sm',
  };

  return (
    <div className={`flex items-center gap-3 select-none ${className}`}>
      <div className={`relative ${iconSizes[size]} rounded-2xl bg-gradient-to-tr from-sky-600 via-sky-500 to-cyan-400 p-0.5 shadow-md shadow-sky-500/20 flex items-center justify-center text-white transition-transform hover:scale-105 duration-300`}>
        <div className="w-full h-full bg-gradient-to-br from-sky-600 to-sky-700 rounded-[14px] flex items-center justify-center relative overflow-hidden">
          {/* Subtle background glow */}
          <div className="absolute -right-2 -top-2 w-8 h-8 bg-white/20 rounded-full blur-sm" />
          <Apple className="w-5 h-5 text-white drop-shadow" />
          <div className="absolute -bottom-1 -right-1 bg-white text-sky-600 rounded-full p-0.5 shadow-sm">
            <Activity className="w-3 h-3 text-sky-500 stroke-[3]" />
          </div>
        </div>
      </div>

      <div className="flex flex-col">
        <div className="flex items-center gap-1.5">
          <span className={`${textSizes[size]} font-extrabold tracking-tight bg-gradient-to-r from-sky-900 via-sky-800 to-sky-600 bg-clip-text text-transparent`}>
            {title}
          </span>
          <Sparkles className="w-3.5 h-3.5 text-sky-400 fill-sky-400/30" />
        </div>
        {subtitle && (
          <span className={`${subTextSizes[size]} font-medium text-sky-600/80 uppercase tracking-wider`}>
            {subtitle}
          </span>
        )}
      </div>
    </div>
  );
};
