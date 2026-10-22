import React from 'react';
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface AlertProps {
  type?: 'error' | 'success' | 'info';
  title?: string;
  children: React.ReactNode;
  onClose?: () => void;
  className?: string;
}

export const Alert: React.FC<AlertProps> = ({
  type = 'error',
  title,
  children,
  onClose,
  className,
}) => {
  const styles = {
    error: {
      container: 'bg-rose-50/90 border-rose-200 text-rose-800',
      icon: <AlertCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />,
      titleColor: 'text-rose-900',
    },
    success: {
      container: 'bg-emerald-50/90 border-emerald-200 text-emerald-800',
      icon: <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />,
      titleColor: 'text-emerald-900',
    },
    info: {
      container: 'bg-sky-50/90 border-sky-200 text-sky-800',
      icon: <Info className="w-5 h-5 text-sky-500 shrink-0 mt-0.5" />,
      titleColor: 'text-sky-900',
    },
  }[type];

  return (
    <div
      role="alert"
      className={cn(
        'relative flex items-start gap-3 rounded-xl border p-4 text-sm shadow-sm animate-fade-in',
        styles.container,
        className
      )}
    >
      {styles.icon}
      <div className="flex-1">
        {title && <h5 className={cn('font-semibold leading-none tracking-tight mb-1', styles.titleColor)}>{title}</h5>}
        <div className="text-xs sm:text-sm leading-relaxed">{children}</div>
      </div>
      {onClose && (
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-slate-600 rounded-md p-1 transition-colors"
          aria-label="Fechar"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};
