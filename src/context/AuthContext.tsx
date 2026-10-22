import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  User,
  signInWithNeon,
  signUpWithNeon,
  signOutFromNeon,
  getStoredSession,
  checkNeonSession,
} from '@/lib/auth';

export type AppPage = 'login' | 'register' | 'dashboard';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  currentPage: AppPage;
  setCurrentPage: (page: AppPage) => void;
  login: (email: string, pass: string) => Promise<void>;
  register: (name: string, email: string, pass: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [currentPage, setCurrentPage] = useState<AppPage>('login');

  // Inicializa sessão persistida
  useEffect(() => {
    async function initSession() {
      try {
        const stored = getStoredSession();
        if (stored?.user) {
          setUser(stored.user);
          setCurrentPage('dashboard');
        }

        const validUser = await checkNeonSession();
        if (validUser) {
          setUser(validUser);
          setCurrentPage('dashboard');
        } else if (!stored?.user) {
          setUser(null);
          setCurrentPage('login');
        }
      } catch (err) {
        console.error('Falha ao restaurar sessão:', err);
      } finally {
        setLoading(false);
      }
    }

    initSession();
  }, []);

  const login = async (email: string, pass: string) => {
    setLoading(true);
    try {
      const loggedUser = await signInWithNeon(email, pass);
      setUser(loggedUser);
      setCurrentPage('dashboard');
    } finally {
      setLoading(false);
    }
  };

  const register = async (name: string, email: string, pass: string) => {
    setLoading(true);
    try {
      const newUser = await signUpWithNeon(name, email, pass);
      setUser(newUser);
      setCurrentPage('dashboard');
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await signOutFromNeon();
      setUser(null);
      setCurrentPage('login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        currentPage,
        setCurrentPage,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser utilizado dentro de um AuthProvider');
  }
  return context;
}
