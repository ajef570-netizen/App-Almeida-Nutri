import React, { useState } from 'react';
import { Mail, Lock, LogIn, Sparkles, ShieldCheck } from 'lucide-react';
import { Logo } from '@/components/Logo';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Alert } from '@/components/ui/Alert';
import { useAuth } from '@/context/AuthContext';

export const LoginPage: React.FC = () => {
  const { login, setCurrentPage, loading } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  const validate = () => {
    const errs: { email?: string; password?: string } = {};
    if (!email.trim()) {
      errs.email = 'Informe o seu e-mail.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      errs.email = 'Informe um e-mail válido.';
    }

    if (!password) {
      errs.password = 'Informe a sua senha.';
    } else if (password.length < 9) {
      errs.password = 'A senha possui no mínimo 9 caracteres.';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!validate()) return;

    try {
      await login(email, password);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage('Erro ao realizar login. Por favor, tente novamente.');
      }
    }
  };

  return (
    <div className="min-h-screen bg-mesh flex flex-col justify-between items-center p-4 sm:p-6 lg:p-8 relative overflow-hidden">
      {/* Decorative ambient elements */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-sky-200/40 rounded-full blur-3xl pointer-events-none -z-10 animate-float" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-cyan-200/30 rounded-full blur-3xl pointer-events-none -z-10" />

      {/* Top Header with Logo */}
      <header className="w-full max-w-5xl flex justify-between items-center py-4">
        <Logo size="md" />
        <div className="hidden sm:flex items-center gap-2 text-xs font-semibold text-sky-800 bg-sky-100/80 px-3.5 py-1.5 rounded-full border border-sky-200/70">
          <ShieldCheck className="w-4 h-4 text-sky-600" />
          <span>Ambiente Seguro • Neon Auth</span>
        </div>
      </header>

      {/* Main Login Card */}
      <main className="w-full max-w-md my-auto animate-fade-in">
        <Card className="border-sky-100 shadow-xl shadow-sky-900/5">
          <CardHeader className="text-center pb-2">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-sky-50 text-sky-600 mx-auto mb-3 border border-sky-100 shadow-inner">
              <LogIn className="w-6 h-6 text-sky-600" />
            </div>
            <CardTitle className="text-2xl sm:text-3xl text-slate-800">
              Acesse sua conta
            </CardTitle>
            <CardDescription className="text-slate-500">
              Digite suas credenciais para gerenciar seus pacientes e planos alimentares.
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
              <Label htmlFor="login-email" required>
                E-mail do Nutricionista
              </Label>
              <Input
                id="login-email"
                type="email"
                placeholder="seu.email@exemplo.com"
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
                <Label htmlFor="login-password" required className="mb-0">
                  Senha
                </Label>
                <span className="text-[11px] text-slate-400 font-medium">Mínimo 9 caracteres</span>
              </div>
              <Input
                id="login-password"
                type="password"
                placeholder="•••••••••"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (errors.password) setErrors({ ...errors, password: undefined });
                }}
                icon={<Lock className="w-4 h-4" />}
                showPasswordToggle
                error={errors.password}
                autoComplete="current-password"
                disabled={loading}
              />
            </div>

            <div className="pt-2">
              <Button
                type="submit"
                className="w-full text-base py-3"
                isLoading={loading}
                rightIcon={<LogIn className="w-4 h-4" />}
              >
                Entrar
              </Button>
            </div>
          </form>

          {/* Footer Link */}
          <div className="mt-6 pt-5 border-t border-slate-100 text-center">
            <p className="text-sm text-slate-600">
              Não tem conta?{' '}
              <button
                type="button"
                onClick={() => setCurrentPage('register')}
                className="font-bold text-sky-600 hover:text-sky-700 hover:underline transition-colors inline-flex items-center gap-1"
              >
                Cadastre-se
                <Sparkles className="w-3.5 h-3.5" />
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
