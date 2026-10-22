import React from 'react';
import { Check, X } from 'lucide-react';

interface PasswordStrengthMeterProps {
  password: string;
}

export const PasswordStrengthMeter: React.FC<PasswordStrengthMeterProps> = ({ password }) => {
  if (!password) return null;

  const hasMinLength = password.length >= 9;
  const hasLetter = /[a-zA-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);

  const checks = [
    { label: 'Mínimo de 9 caracteres', passed: hasMinLength, mandatory: true },
    { label: 'Contém letras', passed: hasLetter },
    { label: 'Contém números ou símbolos', passed: hasNumber || hasSpecial },
  ];

  const score = (hasMinLength ? 2 : 0) + (hasLetter ? 1 : 0) + ((hasNumber || hasSpecial) ? 1 : 0);

  const getStrengthBar = () => {
    if (score <= 1) return { color: 'bg-rose-500', width: '25%', label: 'Fraca' };
    if (score === 2) return { color: 'bg-amber-500', width: '50%', label: 'Média' };
    if (score === 3) return { color: 'bg-sky-500', width: '75%', label: 'Boa' };
    return { color: 'bg-emerald-500', width: '100%', label: 'Forte' };
  };

  const strength = getStrengthBar();

  return (
    <div className="mt-2 space-y-2 text-xs animate-fade-in">
      <div className="flex items-center justify-between">
        <span className="text-slate-500 font-medium">Força da senha:</span>
        <span className="font-semibold text-slate-700">{strength.label}</span>
      </div>

      <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
        <div
          className={`h-full transition-all duration-300 ${strength.color}`}
          style={{ width: strength.width }}
        />
      </div>

      <div className="pt-1 space-y-1">
        {checks.map((check, idx) => (
          <div
            key={idx}
            className={`flex items-center gap-1.5 transition-colors ${
              check.passed ? 'text-emerald-600 font-medium' : 'text-slate-400'
            }`}
          >
            {check.passed ? (
              <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
            ) : (
              <X className="w-3.5 h-3.5 text-slate-300 shrink-0" />
            )}
            <span>{check.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
