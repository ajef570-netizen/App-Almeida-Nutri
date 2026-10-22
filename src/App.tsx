import React from 'react';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { LoginPage } from '@/pages/Login';
import { RegisterPage } from '@/pages/Register';
import { DashboardPage } from '@/pages/Dashboard';
import { Logo } from '@/components/Logo';
import { Loader2 } from 'lucide-react';

const AppContent: React.FC = () => {
  const { currentPage, loading, user } = useAuth();

  // Se estiver restaurando a sessão no primeiro carregamento
  if (loading && !user) {
    return (
      <div className="min-h-screen bg-mesh flex flex-col items-center justify-center p-4">
        <div className="flex flex-col items-center gap-6 animate-fade-in text-center">
          <Logo size="lg" />
          <div className="flex items-center gap-2 text-sky-600 font-medium text-sm">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Verificando credenciais seguras...</span>
          </div>
        </div>
      </div>
    );
  }

  // Redirecionamento automático: se logado, sempre exibe o dashboard
  if (user) {
    return <DashboardPage />;
  }

  // Se não logado, renderiza a tela de login ou de cadastro
  if (currentPage === 'register') {
    return <RegisterPage />;
  }

  return <LoginPage />;
};

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
