import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  icon?: React.ReactNode;
  showPasswordToggle?: boolean;
  error?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, icon, showPasswordToggle, error, disabled, ...props }, ref) => {
    const [showPassword, setShowPassword] = useState(false);
    const isPassword = type === 'password';
    const computedType = isPassword && showPassword ? 'text' : type;

    return (
      <div className="w-full">
        <div className="relative flex items-center">
          {icon && (
            <div className="absolute left-3.5 flex items-center pointer-events-none text-slate-400">
              {icon}
            </div>
          )}

          <input
            type={computedType}
            disabled={disabled}
            className={cn(
              'flex h-11 w-full rounded-xl border bg-white px-3.5 py-2 text-sm text-slate-800 placeholder:text-slate-400',
              'transition-all duration-200 ease-in-out',
              'focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500',
              'disabled:cursor-not-allowed disabled:bg-slate-50 disabled:opacity-60',
              icon ? 'pl-10' : '',
              (isPassword && showPasswordToggle) ? 'pr-11' : '',
              error
                ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-500/20 bg-rose-50/20'
                : 'border-slate-200 hover:border-slate-300',
              className
            )}
            ref={ref}
            {...props}
          />

          {isPassword && showPasswordToggle && (
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              tabIndex={-1}
              className="absolute right-3.5 text-slate-400 hover:text-slate-600 focus:outline-none transition-colors"
              aria-label={showPassword ? 'Ocultar senha' : 'Exibir senha'}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          )}
        </div>
        {error && (
          <p className="mt-1.5 text-xs text-rose-600 flex items-center gap-1 font-medium animate-fade-in">
            {error}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
