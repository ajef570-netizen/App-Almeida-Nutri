import React, { useState } from 'react';
import { User as UserIcon, Mail, Lock, CheckCircle2, UserPlus, Sparkles, ShieldCheck } from 'lucide-react';
import confetti from 'canvas-confetti';
import { Logo } from '@/components/Logo';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Alert } from '@/components/ui/Alert';
import { PasswordStrengthMeter } from '@/components/PasswordStrengthMeter';
import { useAuth } from '@/context/AuthContext';

export const RegisterPage: React.FC = () => {
  const { register, setCurrentPage, loading } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [errors, setErrors] = useState<{
    name?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
  }>({});

  const validate = () => {
    const errs: {
      name?: string;
      email?: string;
      password?: string;
      confirmPassword?: string;
    } = {};

    if (!name.trim()) {
      errs.name = 'Informe seu nome completo.';
    } else if (name.trim().length < 3) {
      errs.name = 'O nome deve ter no mínimo 3 caracteres.';
    }

    if (!email.trim()) {
      errs.email = 'Informe o seu e-mail.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      errs.email = 'Informe um e-mail válido.';
    }

    if (!password) {
      errs.password = 'Crie uma senha de acesso.';
    } else if (password.length < 9) {
      errs.password = 'A senha deve ter no mínimo 9 caracteres.';
    }

    if (!confirmPassword) {
      errs.confirmPassword = 'Confirme sua senha.';
    } else if (password !== confirmPassword) {
      errs.confirmPassword = 'As senhas não coincidem.';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const triggerConfetti = () => {
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#0284c7', '#38bdf8', '#7dd3fc', '#0ea5e9', '#ffffff'],
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!validate()) return;

    try {
      await register(name, email, password);
      triggerConfetti();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage('Não foi possível concluir seu cadastro. Tente novamente.');
      }
    }
  };

  return (
    <div className="min-h-screen bg-mesh flex flex-col justify-between items-center p-4 sm:p-6 lg:p-8 relative overflow-hidden">
      {/* Decorative ambient elements */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-sky-200/40 rounded-full blur-3xl pointer-events-none -z-10 animate-float" />
      <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-cyan-200/30 rounded-full blur-3xl pointer-events-none -z-10" />

      {/* Top Header with Logo */}
      <header className="w-full max-w-5xl flex justify-between items-center py-4">
        <Logo size="md" />
        <div className="hidden sm:flex items-center gap-2 text-xs font-semibold text-sky-800 bg-sky-100/80 px-3.5 py-1.5 rounded-full border border-sky-200/70">
          <ShieldCheck className="w-4 h-4 text-sky-600" />
          <span>Cadastro Profissional • Neon Auth</span>
        </div>
      </header>

      {/* Main Register Card */}
      <main className="w-full max-w-md my-auto animate-fade-in">
        <Card className="border-sky-100 shadow-xl shadow-sky-900/5">
          <CardHeader className="text-center pb-2">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-sky-50 text-sky-600 mx-auto mb-3 border border-sky-100 shadow-inner">
              <UserPlus className="w-6 h-6 text-sky-600" />
            </div>
            <CardTitle className="text-2xl sm:text-3xl text-slate-800">
              Criar sua conta
            </CardTitle>
            <CardDescription className="text-slate-500">
              Junte-se à plataforma Almeida Nutri e gerencie seus pacientes com excelência.
            </CardDescription>
          </CardHeader>

          {errorMessage && (
            <div className="mb-5">
              <Alert type="error" onClose={() => setErrorMessage(null)}>
                {errorMessage}
              </Alert>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="register-name" required>
                Nome Completo
              </Label>
              <Input
                id="register-name"
                type="text"
                placeholder="Dra. Mariana Silva"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (errors.name) setErrors({ ...errors, name: undefined });
                }}
                icon={<UserIcon className="w-4 h-4" />}
                error={errors.name}
                autoComplete="name"
                disabled={loading}
              />
            </div>

            <div>
              <Label htmlFor="register-email" required>
                E-mail Profissional
              </Label>
              <Input
                id="register-email"
                type="email"
                placeholder="mariana.nutri@exemplo.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (errors.email) setErrors({ ...errors, email: undefined });
                }}
                icon={<Mail className="w-4 h-4" />}
                error={errors.email}
                autoComplete="email"
                disabled={loading}
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <Label htmlFor="register-password" required className="mb-0">
                  Senha
                </Label>
                <span className="text-[11px] text-sky-700 font-medium bg-sky-50 px-2 py-0.5 rounded border border-sky-100">
                  Mínimo 9 caracteres
                </span>
              </div>
              <Input
                id="register-password"
                type="password"
                placeholder="Crie uma senha segura (9+ dígitos)"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (errors.password) setErrors({ ...errors, password: undefined });
                }}
                icon={<Lock className="w-4 h-4" />}
                showPasswordToggle
                error={errors.password}
                autoComplete="new-password"
                disabled={loading}
              />
              <PasswordStrengthMeter password={password} />
            </div>

            <div>
              <Label htmlFor="register-confirm-password" required>
                Confirmar Senha
              </Label>
              <Input
                id="register-confirm-password"
                type="password"
                placeholder="Repita a senha digitada acima"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  if (errors.confirmPassword) setErrors({ ...errors, confirmPassword: undefined });
                }}
                icon={<Lock className="w-4 h-4" />}
                showPasswordToggle
                error={errors.confirmPassword}
                autoComplete="new-password"
                disabled={loading}
              />
            </div>

            <div className="pt-2">
              <Button
                type="submit"
                className="w-full text-base py-3"
                isLoading={loading}
                rightIcon={<CheckCircle2 className="w-4 h-4" />}
              >
                Criar conta
              </Button>
            </div>
          </form>

          {/* Footer Link */}
          <div className="mt-6 pt-5 border-t border-slate-100 text-center">
            <p className="text-sm text-slate-600">
              Já tem conta?{' '}
              <button
                type="button"
                onClick={() => setCurrentPage('login')}
                className="font-bold text-sky-600 hover:text-sky-700 hover:underline transition-colors"
              >
                Faça login
              </button>
            </p>
          </div>
        </Card>
      </main>

      {/* Footer copyright */}
      <footer className="w-full max-w-5xl py-4 text-center text-xs text-slate-400">
        © {new Date().getFullYear()} Almeida Nutri. Plataforma profissional para nutricionistas.
      </footer>
    </div>
  );
};
